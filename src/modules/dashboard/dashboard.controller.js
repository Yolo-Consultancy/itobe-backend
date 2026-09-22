import { ApiResponse } from "../../utils/api-response.js";
import { DashboardService } from "./dashboard.service.js";
import { VisitorService } from "./visitor.service.js";

export class DashboardController {
  static async getStats(req, res, next) {
    try {
      const stats = await DashboardService.getStatistics();
      return ApiResponse.success(res, stats, "Statistiques du tableau de bord récupérées");
    } catch (error) {
      next(error);
    }
  }

  static async trackVisitor(req, res, next) {
    try {
      await VisitorService.record(req.body?.visitorId, req.body?.path);
      return ApiResponse.success(res, null, "Visiteur enregistré", 204);
    } catch (error) {
      next(error);
    }
  }

  static async getVisitorStats(req, res, next) {
    try {
      const stats = await DashboardService.getVisitorStatistics(req.query?.period);
      return ApiResponse.success(res, stats, "Statistiques des visiteurs récupérées");
    } catch (error) {
      next(error);
    }
  }
}
