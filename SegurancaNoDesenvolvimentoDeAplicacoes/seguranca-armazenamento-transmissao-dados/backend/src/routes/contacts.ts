import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireCsrf } from "../middleware/csrf.js";
import {
  decryptHybrid,
  encryptHybridEcho,
  encryptAtRest,
  decryptAtRest,
} from "../crypto.js";

export const contactsRouter = Router();
contactsRouter.use(requireAuth);

// LIST
contactsRouter.post("/list", async (req, res) => {
  try {
    const { key, iv, data } = req.body;
    const uid = (req as any).uid as number;

    const q =
      "SELECT id, name, phone FROM contacts WHERE user_id = $1 ORDER BY id DESC";
    const { rows } = await pool.query(q, [uid]);

    const items = rows.map((r) => ({
      id: r.id,
      name: decryptAtRest(r.name),
      phone: decryptAtRest(r.phone),
    }));

    return res.json(encryptHybridEcho(key, { items }));
  } catch {
    return res.status(400).json({ error: "Falha ao listar" });
  }
});

// CREATE
contactsRouter.post("/create", requireCsrf, async (req, res) => {
  try {
    const { key, iv, data } = req.body;
    const uid = (req as any).uid as number;
    const dec = JSON.parse(decryptHybrid({ key, iv, data }).toString("utf8"));
    const name = String(dec.name || "").replace(/[<>]/g, "");
    const phone = String(dec.phone || "").replace(/[<>]/g, "");

    const q =
      "INSERT INTO contacts (user_id, name, phone) VALUES ($1, $2, $3) RETURNING id";
    const { rows } = await pool.query(q, [
      uid,
      encryptAtRest(name),
      encryptAtRest(phone),
    ]);

    return res.json(encryptHybridEcho(key, { ok: true, id: rows[0].id }));
  } catch {
    return res.status(400).json({ error: "Falha ao criar" });
  }
});

// UPDATE
contactsRouter.post("/update", requireCsrf, async (req, res) => {
  try {
    const { key, iv, data } = req.body;
    const uid = (req as any).uid as number;
    const dec = JSON.parse(decryptHybrid({ key, iv, data }).toString("utf8"));
    const id = Number(dec.id);
    const name = String(dec.name || "").replace(/[<>]/g, "");
    const phone = String(dec.phone || "").replace(/[<>]/g, "");

    // BAC: só permite atualizar contato do próprio usuário
    const chk = await pool.query("SELECT user_id FROM contacts WHERE id = $1", [
      id,
    ]);
    if (!chk.rowCount || chk.rows[0].user_id !== uid)
      return res.status(403).json({ error: "Acesso negado" });

    await pool.query("UPDATE contacts SET name=$1, phone=$2 WHERE id=$3", [
      encryptAtRest(name),
      encryptAtRest(phone),
      id,
    ]);

    return res.json(encryptHybridEcho(key, { ok: true }));
  } catch {
    return res.status(400).json({ error: "Falha ao atualizar" });
  }
});

// DELETE
contactsRouter.post("/delete", requireCsrf, async (req, res) => {
  try {
    const { key, iv, data } = req.body;
    const uid = (req as any).uid as number;
    const dec = JSON.parse(decryptHybrid({ key, iv, data }).toString("utf8"));
    const id = Number(dec.id);

    const chk = await pool.query("SELECT user_id FROM contacts WHERE id = $1", [
      id,
    ]);
    if (!chk.rowCount || chk.rows[0].user_id !== uid)
      return res.status(403).json({ error: "Acesso negado" });

    await pool.query("DELETE FROM contacts WHERE id=$1", [id]);
    return res.json(encryptHybridEcho(key, { ok: true }));
  } catch {
    return res.status(400).json({ error: "Falha ao excluir" });
  }
});
