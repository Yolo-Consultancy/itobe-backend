import { ENV } from "../config/env.config.js";

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Erreur interne du serveur";
  let errors = err.errors || null;

  // Gestion des erreurs Mongoose CastError (Bad ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Ressource introuvable ou identifiant invalide: ${err.value}`;
  }

  // Gestion des doublons Mongoose (Duplicate Key)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Un enregistrement avec cette valeur pour '${field}' existe déjà.`;
  }

  // Gestion des erreurs de validation Mongoose
  if (err.name === "ValidationError") {
    statusCode = 422;
    errors = Object.values(err.errors).map((e) => e.message);
    message = "Erreur de validation des données fournies.";
  }

  // Gestion des erreurs JWT
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token d'authentification invalide.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expirée. Veuillez vous reconnecter.";
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(ENV.NODE_ENV === "development" && { stack: err.stack }),
  };

  return res.status(statusCode).json(response);
}

export function notFoundHandler(req, res, next) {
  return res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.originalUrl}`,
  });
}
