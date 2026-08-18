import { ApiResponse } from "../../utils/api-response.js";
import { DashboardService } from "./dashboard.service.js";

export class DashboardController {
  static async getStats(req, res, next) {
    try {
      const stats = await DashboardService.getStatistics();
      return ApiResponse.success(res, stats, "Statistiques du tableau de bord récupérées");
    } catch (error) {
      next(error);
    }
  }
}
