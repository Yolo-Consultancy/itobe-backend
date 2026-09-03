import { Router } from "express";
import { ChapitreController } from "./chapitre.controller.js";
import { requireAuth, optionalAuth } from "../../middleware/auth.middleware.js";

const router = Router();

// Routes pour les chapitres par ID
router.get("/:id", optionalAuth, ChapitreController.getChapitreById);
router.put("/:id", requireAuth, ChapitreController.updateChapitre);
router.delete("/:id", requireAuth, ChapitreController.deleteChapitre);

// Versions et historique
router.post("/:id/versions", requireAuth, ChapitreController.creerVersion);
router.get("/:id/versions", requireAuth, ChapitreController.getVersionsChapitre);
router.post("/:id/versions/:versionId/restaurer", requireAuth, ChapitreController.restaurerVersion);

export const chapitreRoutes = router;
