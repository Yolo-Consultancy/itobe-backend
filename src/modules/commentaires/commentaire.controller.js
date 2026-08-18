import { CommentaireService } from "./commentaire.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class CommentaireController {
  static async getAllCommentaires(req, res, next) {
    try {
      const { page, limit, statut, cible, q } = req.query;
      const result = await CommentaireService.getAllCommentaires({ page, limit, statut, cible, q });
      return ApiResponse.paginated(res, result.commentaires, result.pagination, "Commentaires récupérés");
    } catch (error) {
      next(error);
    }
  }

  static async createCommentaire(req, res, next) {
    try {
      const commentaire = await CommentaireService.createCommentaire({
        ...req.body,
        userId: req.user ? req.user._id : null,
        ip: req.ip,
      });
      return ApiResponse.created(res, commentaire, "Commentaire créé et en attente de modération");
    } catch (error) {
      next(error);
    }
  }

  static async modererCommentaire(req, res, next) {
    try {
      const { statut } = req.body; // attendu: "Publié" ou "Rejeté"
      const commentaire = await CommentaireService.modererCommentaire(req.params.id, statut);
      return ApiResponse.success(res, commentaire, "Statut du commentaire mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async deleteCommentaire(req, res, next) {
    try {
      const commentaire = await CommentaireService.deleteCommentaire(req.params.id);
      return ApiResponse.success(res, commentaire, "Commentaire supprimé");
    } catch (error) {
      next(error);
    }
  }
}
