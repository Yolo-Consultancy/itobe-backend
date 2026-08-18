import { Router } from "express";
import { ArticleController } from "./article.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Routes publiques
router.get("/", ArticleController.getAllArticles);
router.get("/:slug", ArticleController.getArticleBySlug);

// Routes d'administration
router.get("/admin/all", requireAuth, restrictTo("admin", "editeur"), ArticleController.getArticlesAdmin);
router.post("/", requireAuth, restrictTo("admin"), ArticleController.createArticle);
router.put("/:id", requireAuth, restrictTo("admin"), ArticleController.updateArticle);
router.delete("/:id", requireAuth, restrictTo("admin"), ArticleController.deleteArticle);

export const articleRoutes = router;
