import { Router } from "express";
import { LivreController } from "./livre.controller.js";
import { ChapitreController } from "../chapitres/chapitre.controller.js";
import { requireAuth, optionalAuth, restrictTo } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

// Routes publiques
router.get("/", LivreController.getAllLivres);

// Routes protégées (admin / editeur) — avant /:slug pour éviter les conflits
router.get("/admin/all", requireAuth, restrictTo("admin", "editeur"), LivreController.getLivresAdmin);
router.post("/", requireAuth, restrictTo("admin", "editeur"), LivreController.createLivre);
router.put("/:id", requireAuth, restrictTo("admin", "editeur"), LivreController.updateLivre);
router.post("/:id/fichier", requireAuth, restrictTo("admin", "editeur"), upload.single("file"), LivreController.uploadFichier);
router.delete("/:id", requireAuth, restrictTo("admin"), LivreController.deleteLivre);

// Sous-routes pour les chapitres d'un livre
router.get("/:livreId/chapitres", optionalAuth, ChapitreController.getChapitresByLivre);
router.post("/:livreId/chapitres", requireAuth, ChapitreController.createChapitre);
router.put("/:livreId/chapitres/reordonner", requireAuth, ChapitreController.reordonnerChapitres);

router.get("/:slug/apercu", LivreController.getApercuLivre);
router.get("/:slug", LivreController.getLivreBySlug);

export const livreRoutes = router;

