import { Router } from "express";
import { LivreController } from "./livre.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Routes publiques
router.get("/", LivreController.getAllLivres);

// Routes protégées (admin / editeur) — avant /:slug pour éviter les conflits
router.get("/admin/all", requireAuth, restrictTo("admin", "editeur"), LivreController.getLivresAdmin);
router.post("/", requireAuth, restrictTo("admin", "editeur"), LivreController.createLivre);
router.put("/:id", requireAuth, restrictTo("admin", "editeur"), LivreController.updateLivre);
router.delete("/:id", requireAuth, restrictTo("admin"), LivreController.deleteLivre);

router.get("/:slug/apercu", LivreController.getApercuLivre);
router.get("/:slug", LivreController.getLivreBySlug);

export const livreRoutes = router;
