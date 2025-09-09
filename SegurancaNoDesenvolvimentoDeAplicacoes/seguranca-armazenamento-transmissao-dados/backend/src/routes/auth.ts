import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { decryptHybrid, encryptHybridEcho, encryptAtRest } from "../crypto.js";
import { issueCsrfToken } from "../middleware/csrf.js";
import { setAuthCookie, clearAuthCookie } from "../middleware/auth.js";

export const authRouter = Router();

// Helper muito simples para sanitização adicional server-side
function sanitizeInput(s: string) {
  return s.replace(/[<>]/g, ""); // evita tags; o front usa textContent
}

authRouter.post("/register", async (req, res) => {
  try {
    const { key, iv, data } = req.body; // híbrido
    const dec = JSON.parse(decryptHybrid({ key, iv, data }).toString("utf8"));
    let { username, password } = dec as { username: string; password: string };

    username = sanitizeInput(username);
    if (!username || !password)
      return res.status(400).json({ error: "Campos obrigatórios" });

    const hash = await bcrypt.hash(password, 12);
    const encUsername = encryptAtRest(username);

    const q =
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id";
    const { rows } = await pool.query(q, [encUsername, hash]); // prepared statement

    // autentica imediatamente
    setAuthCookie(res, { uid: rows[0].id });
    const csrf = issueCsrfToken(res);

    return res.json(encryptHybridEcho(key, { ok: true, csrf }));
  } catch (e) {
    return res.status(400).json({ error: "Falha no registro" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { key, iv, data } = req.body;
    const dec = JSON.parse(decryptHybrid({ key, iv, data }).toString("utf8"));
    let { username, password } = dec as { username: string; password: string };
    username = sanitizeInput(username);

    // Busca todos usuários e compara username desencriptando (simples; para produção use índice funcional)
    const q = "SELECT id, username, password FROM users";
    const { rows } = await pool.query(q);

    let found: { id: number; hash: string } | null = null;
    for (const r of rows) {
      const u = r.username as string;
      const plain = (() => {
        try {
          return require("../crypto.js").decryptAtRest(u);
        } catch {
          return "";
        }
      })();
      if (plain === username) {
        found = { id: r.id, hash: r.password };
        break;
      }
    }

    if (!found) return res.status(401).json({ error: "Credenciais inválidas" });
    const ok = await bcrypt.compare(password, found.hash);
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas" });

    setAuthCookie(res, { uid: found.id });
    const csrf = issueCsrfToken(res);
    return res.json(encryptHybridEcho(key, { ok: true, csrf }));
  } catch {
    return res.status(400).json({ error: "Falha no login" });
  }
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});
