import { Router } from "express";
import { LivreController } from "./livre.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Routes publiques
router.get("/", LivreController.getAllLivres);
router.get("/:slug", LivreController.getLivreBySlug);
router.get("/:slug/apercu", LivreController.getApercuLivre);

// Routes protégées (admin / editeur)
router.get("/admin/all", requireAuth, restrictTo("admin", "editeur"), LivreController.getLivresAdmin);
router.post("/", requireAuth, restrictTo("admin", "editeur"), LivreController.createLivre);
router.put("/:id", requireAuth, restrictTo("admin", "editeur"), LivreController.updateLivre);
router.delete("/:id", requireAuth, restrictTo("admin"), LivreController.deleteLivre);

export const livreRoutes = router;
