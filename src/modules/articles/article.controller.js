import { ArticleService } from "./article.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class ArticleController {
  static async getAllArticles(req, res, next) {
    try {
      const { page, limit, categorie, tag, populaire, q } = req.query;
      const result = await ArticleService.getAllArticles({
        page,
        limit,
        categorie,
        tag,
        populaire,
        q,
        admin: false,
      });
      return ApiResponse.paginated(res, result.articles, result.pagination, "Articles récupérés");
    } catch (error) {
      next(error);
    }
  }

  static async getArticlesAdmin(req, res, next) {
    try {
      const { page, limit, categorie, tag, q } = req.query;
      const result = await ArticleService.getAllArticles({
        page,
        limit,
        categorie,
        tag,
        q,
        admin: true,
      });
      return ApiResponse.paginated(res, result.articles, result.pagination, "Tous les articles (Admin)");
    } catch (error) {
      next(error);
    }
  }

  static async getArticleBySlug(req, res, next) {
    try {
      const result = await ArticleService.getArticleBySlug(req.params.slug, true);
      return ApiResponse.success(res, result, "Article récupéré");
    } catch (error) {
      next(error);
    }
  }

  static async createArticle(req, res, next) {
    try {
      const article = await ArticleService.createArticle(req.body);
      return ApiResponse.created(res, article, "Article créé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateArticle(req, res, next) {
    try {
      const article = await ArticleService.updateArticle(req.params.id, req.body);
      return ApiResponse.success(res, article, "Article mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async deleteArticle(req, res, next) {
    try {
      await ArticleService.deleteArticle(req.params.id);
      return ApiResponse.success(res, null, "Article supprimé");
    } catch (error) {
      next(error);
    }
  }
}
