import { MediaService } from "./media.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class MediaController {
  static async getAllMedias(req, res, next) {
    try {
      const { page, limit, type, q } = req.query;
      const result = await MediaService.getAllMedias({ page, limit, type, q });
      return ApiResponse.paginated(res, result.medias, result.pagination, "Médias récupérés");
    } catch (error) {
      next(error);
    }
  }

  static async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.error(res, "Aucun fichier envoyé", 400);
      }
      const media = await MediaService.uploadFile(req.file, req.user._id);
      return ApiResponse.created(res, media, "Fichier téléversé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async createMediaManuel(req, res, next) {
    try {
      const media = await MediaService.createMediaManuel({
        ...req.body,
        uploader: req.user._id,
      });
      return ApiResponse.created(res, media, "Média créé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async deleteMedia(req, res, next) {
    try {
      await MediaService.deleteMedia(req.params.id);
      return ApiResponse.success(res, null, "Média supprimé");
    } catch (error) {
      next(error);
    }
  }
}
