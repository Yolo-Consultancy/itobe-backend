import { AbonnementService } from "./abonnement.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class AbonnementController {
  static async getMonAbonnement(req, res, next) {
    try {
      const abonnement = await AbonnementService.getAbonnement(req.user._id);
      return ApiResponse.success(res, abonnement, "Abonnement récupéré");
    } catch (error) {
      next(error);
    }
  }

  static async souscrire(req, res, next) {
    try {
      const abonnement = await AbonnementService.souscrire(req.user._id, req.body);
      return ApiResponse.success(res, abonnement, "Abonnement activé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async renouveler(req, res, next) {
    try {
      const abonnement = await AbonnementService.renouveler(req.user._id);
      return ApiResponse.success(res, abonnement, "Abonnement renouvelé");
    } catch (error) {
      next(error);
    }
  }

  static async toggleAutoRenewal(req, res, next) {
    try {
      const abonnement = await AbonnementService.toggleAutoRenewal(req.user._id);
      return ApiResponse.success(res, abonnement, "Préférence de renouvellement mise à jour");
    } catch (error) {
      next(error);
    }
  }

  static async annuler(req, res, next) {
    try {
      const abonnement = await AbonnementService.annuler(req.user._id, req.body);
      return ApiResponse.success(res, abonnement, "Abonnement annulé");
    } catch (error) {
      next(error);
    }
  }

  static async getFactures(req, res, next) {
    try {
      const factures = await AbonnementService.getFactures(req.user._id);
      return ApiResponse.success(res, factures, "Factures récupérées");
    } catch (error) {
      next(error);
    }
  }
}
