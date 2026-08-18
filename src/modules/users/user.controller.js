import { UserService } from "./user.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class UserController {
  static async getAllUsers(req, res, next) {
    try {
      const { page, limit, role, statut, q } = req.query;
      const { users, pagination } = await UserService.getAllUsers({ page, limit, role, statut, q });
      return ApiResponse.paginated(res, users, pagination, "Liste des utilisateurs récupérée");
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return ApiResponse.success(res, user, "Détails de l'utilisateur récupérés");
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req, res, next) {
    try {
      const user = await UserService.createUser(req.body);
      return ApiResponse.created(res, user, "Utilisateur créé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      return ApiResponse.success(res, user, "Utilisateur mis à jour avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      await UserService.deleteUser(req.params.id);
      return ApiResponse.success(res, null, "Utilisateur supprimé avec succès");
    } catch (error) {
      next(error);
    }
  }
}
