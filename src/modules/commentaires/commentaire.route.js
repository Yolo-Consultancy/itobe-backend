import { Router } from "express";
import { CommentaireController } from "./commentaire.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(restrictTo("admin", "editeur"));

router.get("/", CommentaireController.getAllCommentaires);
router.post("/", CommentaireController.createCommentaire);
router.patch("/:id", CommentaireController.modererCommentaire);
router.delete("/:id", CommentaireController.deleteCommentaire);

export const commentaireRoutes = router;
