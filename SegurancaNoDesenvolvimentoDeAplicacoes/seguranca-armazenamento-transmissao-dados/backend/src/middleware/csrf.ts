import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { config } from "../config.js";

export function issueCsrfToken(res: Response) {
  const token = randomBytes(24).toString("hex");
  res.cookie(config.csrfCookieName, token, {
    httpOnly: false,
    sameSite: "strict",
    secure: true,
    path: "/",
  });
  return token;
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const header = req.header("X-CSRF-Token");
  const cookie = req.cookies[config.csrfCookieName];
  if (!header || !cookie || header !== cookie) {
    return res.status(403).json({ error: "CSRF token inválido" });
  }
  next();
}
