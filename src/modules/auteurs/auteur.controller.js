import { AuteurService } from "./auteur.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class AuteurController {
  static async getAllAuteurs(req, res, next) {
    try {
      const { page, limit, q } = req.query;
      const result = await AuteurService.getAllAuteurs({ page, limit, q });
      if (result.pagination) {
        return ApiResponse.paginated(res, result.auteurs, result.pagination, "Auteurs récupérés");
      }
      return ApiResponse.success(res, result.auteurs, "Auteurs récupérés");
    } catch (error) {
      next(error);
    }
  }

  static async getAuteurBySlug(req, res, next) {
    try {
      const result = await AuteurService.getAuteurBySlug(req.params.slug);
      return ApiResponse.success(res, result, "Fiche auteur récupérée");
    } catch (error) {
      next(error);
    }
  }

  static async createAuteur(req, res, next) {
    try {
      const auteur = await AuteurService.createAuteur(req.body);
      return ApiResponse.created(res, auteur, "Auteur créé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateAuteur(req, res, next) {
    try {
      const auteur = await AuteurService.updateAuteur(req.params.id, req.body);
      return ApiResponse.success(res, auteur, "Auteur mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async deleteAuteur(req, res, next) {
    try {
      await AuteurService.deleteAuteur(req.params.id);
      return ApiResponse.success(res, null, "Auteur supprimé");
    } catch (error) {
      next(error);
    }
  }
}
