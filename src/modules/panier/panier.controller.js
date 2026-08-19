import { PanierService } from "./panier.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class PanierController {
  static async getCart(req, res, next) {
    try {
      const panier = await PanierService.getOrCreate(req.user._id);
      return ApiResponse.success(res, panier, "Panier récupéré");
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req, res, next) {
    try {
      const panier = await PanierService.addItem(req.user._id, req.body);
      return ApiResponse.success(res, panier, "Article ajouté au panier");
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(req, res, next) {
    try {
      const panier = await PanierService.updateItem(req.user._id, req.params.livreId, req.body);
      return ApiResponse.success(res, panier, "Panier mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req, res, next) {
    try {
      const panier = await PanierService.removeItem(req.user._id, req.params.livreId);
      return ApiResponse.success(res, panier, "Article retiré du panier");
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req, res, next) {
    try {
      const panier = await PanierService.clear(req.user._id);
      return ApiResponse.success(res, panier, "Panier vidé");
    } catch (error) {
      next(error);
    }
  }

  static async mergeGuest(req, res, next) {
    try {
      const { items } = req.body;
      const panier = await PanierService.mergeGuestItems(req.user._id, items);
      return ApiResponse.success(res, panier, "Panier fusionné");
    } catch (error) {
      next(error);
    }
  }

  static async checkout(req, res, next) {
    try {
      const result = await PanierService.checkout(req.user._id, req.body);
      return ApiResponse.created(res, result, "Commande(s) confirmée(s)");
    } catch (error) {
      next(error);
    }
  }
}
