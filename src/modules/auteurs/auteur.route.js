import { Router } from "express";
import { AuteurController } from "./auteur.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Routes publiques
router.get("/", AuteurController.getAllAuteurs);

// Fiche auteur du compte connecté (avant /:slug)
router.get(
  "/me/profile",
  requireAuth,
  restrictTo("admin", "editeur"),
  AuteurController.getMyProfile,
);
router.patch(
  "/me/bio",
  requireAuth,
  restrictTo("admin", "editeur"),
  AuteurController.updateMyBio,
);

router.get("/:slug", AuteurController.getAuteurBySlug);

// Routes protégées (admin / editeur)
router.use(requireAuth);
router.use(restrictTo("admin", "editeur"));

router.post("/", AuteurController.createAuteur);
router.put("/:id", AuteurController.updateAuteur);
router.delete("/:id", restrictTo("admin"), AuteurController.deleteAuteur);

export const auteurRoutes = router;
