import { BibliothequeService } from "./bibliotheque.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class BibliothequeController {
  static async getLibrary(req, res, next) {
    try {
      const data = await BibliothequeService.getUserLibrary(req.user._id);
      return ApiResponse.success(res, data, "Bibliothèque récupérée");
    } catch (error) {
      next(error);
    }
  }

  static async toggleFavori(req, res, next) {
    try {
      const result = await BibliothequeService.toggleFavori(req.user._id, req.params.slug);
      return ApiResponse.success(res, result, result.estFavori ? "Ajouté aux favoris" : "Retiré des favoris");
    } catch (error) {
      next(error);
    }
  }

  static async registerDownload(req, res, next) {
    try {
      const result = await BibliothequeService.enregistrerTelechargement(req.user._id, req.params.slug);
      return ApiResponse.success(res, result, "Téléchargement enregistré");
    } catch (error) {
      next(error);
    }
  }

  static async updateProgress(req, res, next) {
    try {
      const result = await BibliothequeService.mettreAJourProgression(req.user._id, req.body);
      return ApiResponse.success(res, result, "Progression sauvegardée");
    } catch (error) {
      next(error);
    }
  }

  static async manageBookmarks(req, res, next) {
    try {
      const result = await BibliothequeService.gererMarquePages(req.user._id, req.body);
      return ApiResponse.success(res, result, result.ajoute ? "Marque-page ajouté" : "Marque-page retiré");
    } catch (error) {
      next(error);
    }
  }

  static async syncDevices(req, res, next) {
    try {
      const result = await BibliothequeService.synchroniser(req.user._id, req.body);
      return ApiResponse.success(res, result, "Synchronisation réussie");
    } catch (error) {
      next(error);
    }
  }

  static async checkAccess(req, res, next) {
    try {
      const result = await BibliothequeService.verifierAccesLecture(req.user._id, req.params.slug);
      return ApiResponse.success(res, result, "Droit d'accès au livre vérifié");
    } catch (error) {
      next(error);
    }
  }
}
