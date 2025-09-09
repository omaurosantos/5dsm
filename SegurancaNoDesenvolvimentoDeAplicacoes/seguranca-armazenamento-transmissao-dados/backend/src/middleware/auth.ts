import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export type JwtPayload = { uid: number };

export function setAuthCookie(res: Response, payload: JwtPayload) {
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "2h" });
  res.cookie("auth", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie("auth", { path: "/" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.auth;
  if (!token) return res.status(401).json({ error: "Não autenticado" });
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    (req as any).uid = decoded.uid;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}
