import { LivreService } from "./livre.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class LivreController {
  static async getAllLivres(req, res, next) {
    try {
      const { page, limit, categorie, format, prixMin, prixMax, disponible, aLaUne, tri, q } = req.query;
      const result = await LivreService.getAllLivres({
        page,
        limit,
        categorie,
        format,
        prixMin,
        prixMax,
        disponible,
        aLaUne,
        tri,
        q,
        admin: false,
      });
      return ApiResponse.paginated(res, result.livres, result.pagination, "Livres récupérés");
    } catch (error) {
      next(error);
    }
  }

  static async getLivresAdmin(req, res, next) {
    try {
      const { page, limit, categorie, format, disponible, q } = req.query;
      const result = await LivreService.getAllLivres({
        page,
        limit,
        categorie,
        format,
        disponible,
        q,
        admin: true,
      });
      return ApiResponse.paginated(res, result.livres, result.pagination, "Tous les livres (Admin)");
    } catch (error) {
      next(error);
    }
  }

  static async getLivreBySlug(req, res, next) {
    try {
      const result = await LivreService.getLivreBySlug(req.params.slug);
      return ApiResponse.success(res, result, "Détail de l'ouvrage récupéré");
    } catch (error) {
      next(error);
    }
  }

  static async getApercuLivre(req, res, next) {
    try {
      const result = await LivreService.getApercuLivre(req.params.slug);
      return ApiResponse.success(res, result, "Aperçu gratuit récupéré");
    } catch (error) {
      next(error);
    }
  }

  static async createLivre(req, res, next) {
    try {
      const livre = await LivreService.createLivre(req.body);
      return ApiResponse.created(res, livre, "Livre créé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateLivre(req, res, next) {
    try {
      const livre = await LivreService.updateLivre(req.params.id, req.body);
      return ApiResponse.success(res, livre, "Livre mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async uploadFichier(req, res, next) {
    try {
      const livre = await LivreService.uploadFichier(req.params.id, req.file, req.body.format);
      return ApiResponse.success(res, livre, "Fichier du livre téléversé");
    } catch (error) {
      next(error);
    }
  }

  static async deleteLivre(req, res, next) {
    try {
      await LivreService.deleteLivre(req.params.id);
      return ApiResponse.success(res, null, "Livre supprimé");
    } catch (error) {
      next(error);
    }
  }
}
