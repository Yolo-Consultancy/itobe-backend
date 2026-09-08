import { YoutubeService } from "./youtube.service.js";

export class YoutubeController {
  static async getVideos(req, res, next) {
    try {
      const limit = req.query.limit;
      const resultat = await YoutubeService.getVideos({ limit });
      return res.json({
        success: true,
        configured: true,
        channelId: resultat.channelId,
        channelUrl: resultat.channelUrl,
        count: resultat.count,
        data: resultat.data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStatus(_req, res, next) {
    try {
      return res.json({
        success: true,
        configured: YoutubeService.estConfigure(),
      });
    } catch (error) {
      next(error);
    }
  }
}
