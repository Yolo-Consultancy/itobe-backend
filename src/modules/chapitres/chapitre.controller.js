import { ChapitreService } from "./chapitre.service.js";

export class ChapitreController {
  static async getChapitresByLivre(req, res, next) {
    try {
      const { livreId } = req.params;
      const chapitres = await ChapitreService.getChapitresByLivre(livreId, req.user);
      return res.json({
        success: true,
        count: chapitres.length,
        data: chapitres,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChapitreById(req, res, next) {
    try {
      const { id } = req.params;
      const chapitre = await ChapitreService.getChapitreById(id, req.user);
      return res.json({
        success: true,
        data: chapitre,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createChapitre(req, res, next) {
    try {
      const { livreId } = req.params;
      const chapitre = await ChapitreService.createChapitre(livreId, req.body, req.user);
      return res.status(201).json({
        success: true,
        message: "Chapitre créé avec succès",
        data: chapitre,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateChapitre(req, res, next) {
    try {
      const { id } = req.params;
      const chapitre = await ChapitreService.updateChapitre(id, req.body, req.user);
      return res.json({
        success: true,
        message: "Chapitre mis à jour avec succès",
        data: chapitre,
      });
    } catch (error) {
      // Si l'erreur contient des détails de conflit (409), les transmettre dans la réponse
      if (error.statusCode === 409 && error.details) {
        return res.status(409).json({
          success: false,
          message: error.message,
          details: error.details,
        });
      }
      next(error);
    }
  }

  static async reordonnerChapitres(req, res, next) {
    try {
      const { livreId } = req.params;
      const chapitres = await ChapitreService.reordonnerChapitres(
        livreId,
        req.body.chapitres || req.body,
        req.user
      );
      return res.json({
        success: true,
        message: "Chapitres réordonnés avec succès",
        data: chapitres,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteChapitre(req, res, next) {
    try {
      const { id } = req.params;
      const resultat = await ChapitreService.deleteChapitre(id, req.user);
      return res.json(resultat);
    } catch (error) {
      next(error);
    }
  }

  static async creerVersion(req, res, next) {
    try {
      const { id } = req.params;
      const version = await ChapitreService.creerVersion(id, req.body, req.user);
      return res.status(201).json({
        success: true,
        message: "Point de sauvegarde créé avec succès",
        data: version,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getVersionsChapitre(req, res, next) {
    try {
      const { id } = req.params;
      const versions = await ChapitreService.getVersionsChapitre(id, req.user);
      return res.json({
        success: true,
        count: versions.length,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async restaurerVersion(req, res, next) {
    try {
      const { id, versionId } = req.params;
      const chapitre = await ChapitreService.restaurerVersion(id, versionId, req.user);
      return res.json({
        success: true,
        message: "Version restaurée avec succès",
        data: chapitre,
      });
    } catch (error) {
      next(error);
    }
  }
}
