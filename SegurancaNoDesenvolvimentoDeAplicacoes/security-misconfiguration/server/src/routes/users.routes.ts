import { Router } from "express";
import { changePassword, createUser, loginUser, logoutUser } from "../controllers/user.controller";
import { validateBody } from "../middlewares/validateBody";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Criar usuário
router.post(
  "/",
  validateBody([
    { name: "username", required: true, type: "string", minLength: 3 },
    { name: "password", required: true, type: "string", minLength: 6 },
  ]),
  createUser,
);

// Login
router.post(
  "/login",
  validateBody([
    { name: "username", required: true, type: "string" },
    { name: "password", required: true, type: "string" },
  ]),
  loginUser,
);

// Logout
router.post("/logout", authMiddleware, logoutUser);

// Alterar senha
// Uso de PATCH (boa prática, já que estamos alterando parcialmente o recurso)
router.patch(
  "/password",
  authMiddleware,
  validateBody([
    { name: "oldPassword", required: true, type: "string", minLength: 6 },
    { name: "newPassword", required: true, type: "string", minLength: 6 },
  ]),
  changePassword,
);

export default router;
