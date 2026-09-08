import { PageService } from "./page.service.js";

export class PageController {
  static async getPagesByChapitre(req, res, next) {
    try {
      const { chapitreId } = req.params;
      const pages = await PageService.getPagesByChapitre(chapitreId, req.user);
      return res.json({
        success: true,
        count: pages.length,
        data: pages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPageById(req, res, next) {
    try {
      const { id } = req.params;
      const page = await PageService.getPageById(id, req.user);
      return res.json({
        success: true,
        data: page,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createPage(req, res, next) {
    try {
      const { chapitreId } = req.params;
      const page = await PageService.createPage(chapitreId, req.body, req.user);
      return res.status(201).json({
        success: true,
        message: "Page créée avec succès",
        data: page,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePage(req, res, next) {
    try {
      const { id } = req.params;
      const page = await PageService.updatePage(id, req.body, req.user);
      return res.json({
        success: true,
        message: "Page mise à jour avec succès",
        data: page,
      });
    } catch (error) {
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

  static async reordonnerPages(req, res, next) {
    try {
      const { chapitreId } = req.params;
      const pages = await PageService.reordonnerPages(
        chapitreId,
        req.body.pages || req.body,
        req.user,
      );
      return res.json({
        success: true,
        message: "Pages réordonnées avec succès",
        data: pages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deletePage(req, res, next) {
    try {
      const { id } = req.params;
      const resultat = await PageService.deletePage(id, req.user);
      return res.json(resultat);
    } catch (error) {
      next(error);
    }
  }
}
