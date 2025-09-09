import { Router } from "express";
import { getPublicKeyPem } from "../crypto.js";

export const publicRouter = Router();

publicRouter.get("/public-key", (_req, res) => {
  res.type("text/plain").send(getPublicKeyPem());
});
