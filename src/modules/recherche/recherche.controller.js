import { RechercheService } from "./recherche.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class RechercheController {
  static async search(req, res, next) {
    try {
      const { q, page, limit } = req.query;
      const result = await RechercheService.search(q, { page, limit });
      return ApiResponse.paginated(res, result.results, result.pagination, "Résultats de recherche");
    } catch (error) {
      next(error);
    }
  }
}
