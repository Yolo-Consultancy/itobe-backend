import jwt from "jsonwebtoken";
import { ENV } from "../config/env.config.js";
import { AppError } from "../utils/api-error.js";
import { User } from "../modules/users/user.model.js";

export async function requireAuth(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Accès non autorisé. Vous devez être connecté.", 401));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError("L'utilisateur associé à cette session n'existe plus.", 401));
    }

    if (user.statut === "Suspendu") {
      return next(new AppError("Votre compte est actuellement suspendu.", 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.statut !== "Suspendu") {
      req.user = user;
    }
    next();
  } catch (error) {
    // Si token invalide dans optionalAuth, on continue sans req.user
    next();
  }
}

export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("Vous n'avez pas les autorisations requises pour effectuer cette action.", 403)
      );
    }
    next();
  };
}
