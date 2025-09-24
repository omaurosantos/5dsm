import { Request, Response } from "express";
import bcrypt from "bcrypt";
import db from "../configs/db";
import { generateToken } from "../utils/jwt";
import type { UserPayload } from "../types/express";
import redisClient from "../configs/redis";
import crypto from "crypto";

// --- Criar usuário ---
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      hashedPassword,
    ]);

    res.status(201).json({
      success: true,
      data: { message: "Usuário criado com sucesso." },
    });
  } catch (error: any) {
    console.error(error.message);
    if (error.code === "23505") {
      res.status(400).json({
        success: false,
        error: error.message || "Nome de usuário já cadastrado. Escolha outro.",
      });
      return;
    }

    res.status(500).json({ success: false, error: "Erro ao criar usuário." });
  }
};

// --- Login de usuário ---
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const result = await db.query("SELECT id,username,password FROM users WHERE username = $1", [
      username,
    ]);
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: "Credenciais inválidas." });
      return;
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ success: false, error: "Credenciais inválidas." });
      return;
    }

    const payload: UserPayload = { id: user.id, username: user.username };

    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      data: {
        message: "Login realizado com sucesso.",
        token,
        user: { id: user.id, username: user.username },
      },
    });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Erro ao realizar login." });
  }
};

// --- Logout de usuário ---
// O token será adicionado ao Redis blacklist até expirar
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // `authMiddleware` já validou o token, basta recuperá-lo
    const token = req.headers.authorization!.split(" ")[1];

    const decoded: any = req.user; // vem preenchido pelo middleware
    const exp = decoded?.exp;
    if (!exp) {
      res.status(400).json({ success: false, error: "Token inválido" });
      return;
    }

    // TTL em segundos
    const ttl = exp - Math.floor(Date.now() / 1000);

    // Usar hash do token para evitar armazenar JWT completo no Redis
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    if (ttl > 0) {
      await redisClient.setex(`blacklist:jwt:${tokenHash}`, ttl, "true");
    } else {
      // Se já expirou, ainda adiciona por 60s para evitar race condition
      await redisClient.setex(`blacklist:jwt:${tokenHash}`, 60, "true");
    }

    res.status(200).json({
      success: true,
      data: { message: "Logout realizado com sucesso. Token invalidado." },
    });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Erro ao realizar logout." });
  }
};

// --- Alterar senha do usuário ---
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // `authMiddleware` já populou req.user
    const { id } = req.user as UserPayload;
    const { oldPassword, newPassword } = req.body;

    const result = await db.query("SELECT password FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Usuário não encontrado" });
      return;
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      res.status(401).json({ success: false, error: "Senha atual incorreta" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, id]);

    res.status(200).json({
      success: true,
      data: { message: "Senha alterada com sucesso" },
    });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Erro ao alterar senha." });
  }
};
