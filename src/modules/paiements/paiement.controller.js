import { PaiementService } from "./paiement.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class PaiementController {
  static async getAllPaiements(req, res, next) {
    try {
      const { page, limit, statut, moyen, q } = req.query;
      const result = await PaiementService.getAllPaiements({ page, limit, statut, moyen, q });
      return ApiResponse.paginated(res, result.paiements, result.pagination, "Transactions récupérées");
    } catch (error) {
      next(error);
    }
  }

  static async getPaiementById(req, res, next) {
    try {
      const paiement = await PaiementService.getPaiementById(req.params.id);
      return ApiResponse.success(res, paiement, "Détail de la transaction");
    } catch (error) {
      next(error);
    }
  }

  static async createPaiement(req, res, next) {
    try {
      const paiement = await PaiementService.createPaiement(req.body);
      return ApiResponse.created(res, paiement, "Paiement enregistré");
    } catch (error) {
      next(error);
    }
  }

  static async updateStatut(req, res, next) {
    try {
      const paiement = await PaiementService.updatePaiementStatut(req.params.id, req.body.statut);
      return ApiResponse.success(res, paiement, "Statut de paiement mis à jour");
    } catch (error) {
      next(error);
    }
  }
}
