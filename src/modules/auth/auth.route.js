import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import { limiteRequetes } from "../../middleware/rate-limit.middleware.js";

const router = Router();
const limiteAuth = limiteRequetes("auth", 10, 15 * 60 * 1000);

// Routes publiques
router.post("/register", limiteAuth, AuthController.register);
router.post("/login", limiteAuth, AuthController.login);
router.post("/refresh-token", limiteAuth, AuthController.refreshToken);
router.post("/forgot-password", limiteAuth, AuthController.forgotPassword);
router.post("/reset-password", limiteAuth, AuthController.resetPassword);

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
