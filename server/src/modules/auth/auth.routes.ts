import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { loginSchema, registerSchema, resetPasswordSchema } from "./auth.schema.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/register", validate(registerSchema), authController.register);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
router.get("/profile", authenticate, authController.getProfile);

export default router;
