import { CategoryService } from "./category.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class CategoryController {
  static async getCategories(req, res, next) {
    try {
      const { type, visibilite, q } = req.query;
      const categories = await CategoryService.getCategories({ type, visibilite, q });
      return ApiResponse.success(res, categories, "Catégories récupérées");
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryById(req, res, next) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      return ApiResponse.success(res, category, "Détails de la catégorie");
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body);
      return ApiResponse.created(res, category, "Catégorie créée avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body);
      return ApiResponse.success(res, category, "Catégorie mise à jour");
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      return ApiResponse.success(res, null, "Catégorie supprimée");
    } catch (error) {
      next(error);
    }
  }
}
