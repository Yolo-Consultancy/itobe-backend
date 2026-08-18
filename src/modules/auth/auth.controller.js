import { AuthService } from "./auth.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return ApiResponse.created(res, result, "Compte créé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const metaConnexion = {
        appareil: req.headers["user-agent"] ? "Web / Mobile" : "Inconnu",
        navigateur: req.headers["user-agent"] || "Inconnu",
        ip: req.ip || req.connection.remoteAddress || "127.0.0.1",
      };
      const result = await AuthService.login({ ...req.body, metaConnexion });
      return ApiResponse.success(res, result, "Connexion réussie");
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      return ApiResponse.success(res, result, "Tokens rafraîchis");
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user._id);
      return ApiResponse.success(res, user, "Profil récupéré");
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const user = await AuthService.updateProfile(req.user._id, req.body);
      return ApiResponse.success(res, user, "Profil mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const result = await AuthService.changePassword(req.user._id, req.body);
      return ApiResponse.success(res, result, "Mot de passe modifié");
    } catch (error) {
      next(error);
    }
  }

  static async setup2FA(req, res, next) {
    try {
      const result = await AuthService.setup2FA(req.user._id);
      return ApiResponse.success(res, result, "Secret 2FA généré");
    } catch (error) {
      next(error);
    }
  }

  static async verify2FA(req, res, next) {
    try {
      const result = await AuthService.verify2FA(req.user._id, req.body.code);
      return ApiResponse.success(res, result, "2FA activée avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async deleteMyAccount(req, res, next) {
    try {
      const result = await AuthService.deleteMyAccount(req.user._id);
      return ApiResponse.success(res, result, "Compte supprimé");
    } catch (error) {
      next(error);
    }
  }
}
