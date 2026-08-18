import { PromotionService } from "./promotion.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class PromotionController {
  static async getAllPromotions(req, res, next) {
    try {
      const { q, actif } = req.query;
      const promotions = await PromotionService.getAllPromotions({ q, actif });
      return ApiResponse.success(res, promotions, "Promotions récupérées");
    } catch (error) {
      next(error);
    }
  }

  static async getPromotionById(req, res, next) {
    try {
      const promotion = await PromotionService.getPromotionById(req.params.id);
      return ApiResponse.success(res, promotion, "Détail de la promotion");
    } catch (error) {
      next(error);
    }
  }

  static async createPromotion(req, res, next) {
    try {
      const promotion = await PromotionService.createPromotion(req.body);
      return ApiResponse.created(res, promotion, "Promotion créée avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updatePromotion(req, res, next) {
    try {
      const promotion = await PromotionService.updatePromotion(req.params.id, req.body);
      return ApiResponse.success(res, promotion, "Promotion mise à jour");
    } catch (error) {
      next(error);
    }
  }

  static async deletePromotion(req, res, next) {
    try {
      await PromotionService.deletePromotion(req.params.id);
      return ApiResponse.success(res, null, "Promotion supprimée");
    } catch (error) {
      next(error);
    }
  }
}
