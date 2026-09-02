import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

// Routes publiques
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// Routes privées (utilisateur connecté)
router.use(requireAuth);
router.get("/me", AuthController.getMe);
router.put("/me", AuthController.updateProfile);
router.post("/me/avatar", upload.single("avatar"), AuthController.updateAvatar);
router.put("/change-password", AuthController.changePassword);
router.post("/2fa/setup", AuthController.setup2FA);
router.post("/2fa/verify", AuthController.verify2FA);
router.delete("/me", AuthController.deleteMyAccount);

export const authRoutes = router;
