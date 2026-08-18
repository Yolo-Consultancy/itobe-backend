import { CommandeService } from "./commande.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class CommandeController {
  static async getMyOrders(req, res, next) {
    try {
      const { statut } = req.query;
      const commandes = await CommandeService.getUserOrders(req.user._id, { statut });
      return ApiResponse.success(res, commandes, "Mes commandes récupérées");
    } catch (error) {
      next(error);
    }
  }

  static async getAllOrders(req, res, next) {
    try {
      const { page, limit, statut, moyen, q } = req.query;
      const result = await CommandeService.getAllOrders({ page, limit, statut, moyen, q });
      return ApiResponse.paginated(res, result.commandes, result.pagination, "Liste des commandes récupérée");
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req, res, next) {
    try {
      const commande = await CommandeService.getOrderById(req.params.id);
      return ApiResponse.success(res, commande, "Détail de la commande");
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const commande = await CommandeService.createOrder({
        userId: req.user._id,
        ...req.body,
      });
      return ApiResponse.created(res, commande, "Commande initiée avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req, res, next) {
    try {
      const commande = await CommandeService.updateOrderStatus(req.params.id, req.body);
      return ApiResponse.success(res, commande, "Statut de la commande mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const commande = await CommandeService.cancelOrder(req.params.id, req.user._id);
      return ApiResponse.success(res, commande, "Commande annulée");
    } catch (error) {
      next(error);
    }
  }
}
