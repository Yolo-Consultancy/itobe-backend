import { z } from "zod";
import { NewsletterService } from "./newsletter.service.js";
import { ApiResponse } from "../../utils/api-response.js";
import { AppError } from "../../utils/api-error.js";

export class NewsletterController {
  /* Abonnés */
  static async subscribe(req, res, next) {
    try {
      const parsed = z
        .object({
          email: z.string().trim().email().max(180),
          nom: z.string().trim().max(120).optional(),
          company_website: z.string().optional(),
        })
        .safeParse(req.body);
      if (!parsed.success) throw new AppError("Adresse e-mail invalide.", 422);
      if (parsed.data.company_website) {
        return ApiResponse.success(res, null, "Merci pour votre inscription à la newsletter !");
      }
      const result = await NewsletterService.subscribe({
        email: parsed.data.email,
        nom: parsed.data.nom || "",
      });
      return ApiResponse.success(res, { email: result.abonne?.email }, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getAllAbonnes(req, res, next) {
    try {
      const { page, limit, segment, statut, q } = req.query;
      const result = await NewsletterService.getAllAbonnes({ page, limit, segment, statut, q });
      return ApiResponse.paginated(res, result.abonnes, result.pagination, "Abonnés récupérés");
    } catch (error) {
      next(error);
    }
  }

  static async createAbonne(req, res, next) {
    try {
      const abonne = await NewsletterService.createAbonne(req.body);
      return ApiResponse.created(res, abonne, "Abonné ajouté avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateAbonne(req, res, next) {
    try {
      const abonne = await NewsletterService.updateAbonne(req.params.id, req.body);
      return ApiResponse.success(res, abonne, "Abonné mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async deleteAbonne(req, res, next) {
    try {
      await NewsletterService.deleteAbonne(req.params.id);
      return ApiResponse.success(res, null, "Abonné supprimé");
    } catch (error) {
      next(error);
    }
  }

  /* Campagnes */
  static async getAllCampagnes(req, res, next) {
    try {
      const { page, limit, statut, q } = req.query;
      const result = await NewsletterService.getAllCampagnes({ page, limit, statut, q });
      return ApiResponse.paginated(res, result.campagnes, result.pagination, "Campagnes récupérées");
    } catch (error) {
      next(error);
    }
  }

  static async getCampagneById(req, res, next) {
    try {
      const campagne = await NewsletterService.getCampagneById(req.params.id);
      return ApiResponse.success(res, campagne, "Détail de la campagne");
    } catch (error) {
      next(error);
    }
  }

  static async createCampagne(req, res, next) {
    try {
      const campagne = await NewsletterService.createCampagne(req.body);
      return ApiResponse.created(res, campagne, "Campagne créée avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateCampagne(req, res, next) {
    try {
      const campagne = await NewsletterService.updateCampagne(req.params.id, req.body);
      return ApiResponse.success(res, campagne, "Campagne mise à jour");
    } catch (error) {
      next(error);
    }
  }

  static async envoyerCampagne(req, res, next) {
    try {
      const campagne = await NewsletterService.envoyerCampagne(req.params.id);
      return ApiResponse.success(res, campagne, "Campagne envoyée avec succès");
    } catch (error) {
      next(error);
    }
  }

  /* Templates */
  static async getAllTemplates(req, res, next) {
    try {
      const { q, categorie } = req.query;
      const templates = await NewsletterService.getAllTemplates({ q, categorie });
      return ApiResponse.success(res, templates, "Templates récupérés");
    } catch (error) {
      next(error);
    }
  }

  static async createTemplate(req, res, next) {
    try {
      const template = await NewsletterService.createTemplate(req.body);
      return ApiResponse.created(res, template, "Template créé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateTemplate(req, res, next) {
    try {
      const template = await NewsletterService.updateTemplate(req.params.id, req.body);
      return ApiResponse.success(res, template, "Template mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async deleteTemplate(req, res, next) {
    try {
      await NewsletterService.deleteTemplate(req.params.id);
      return ApiResponse.success(res, null, "Template supprimé");
    } catch (error) {
      next(error);
    }
  }
}
