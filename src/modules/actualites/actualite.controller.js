import { ActualiteService } from "./actualite.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class ActualiteController {
  static async getAllActualites(req, res, next) {
    try {
      const { etat, q } = req.query;
      const actualites = await ActualiteService.getAllActualites({ etat, q });
      return ApiResponse.success(res, actualites, "Actualités récupérées");
    } catch (error) {
      next(error);
    }
  }

  static async getActualiteById(req, res, next) {
    try {
      const act = await ActualiteService.getActualiteById(req.params.id);
      return ApiResponse.success(res, act, "Détail de l'actualité");
    } catch (error) {
      next(error);
    }
  }

  static async createActualite(req, res, next) {
    try {
      const act = await ActualiteService.createActualite(req.body);
      return ApiResponse.created(res, act, "Actualité créée avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateActualite(req, res, next) {
    try {
      const act = await ActualiteService.updateActualite(req.params.id, req.body);
      return ApiResponse.success(res, act, "Actualité mise à jour");
    } catch (error) {
      next(error);
    }
  }

  static async deleteActualite(req, res, next) {
    try {
      await ActualiteService.deleteActualite(req.params.id);
      return ApiResponse.success(res, null, "Actualité supprimée");
    } catch (error) {
      next(error);
    }
  }
}
