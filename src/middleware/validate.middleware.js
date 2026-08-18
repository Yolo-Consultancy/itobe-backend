import { AppError } from "../utils/api-error.js";

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        return next(new AppError("Données de requête non valides", 422, errors));
      }

      // Remplacement avec les valeurs parsées / typées si nécessaire
      if (parsed.data.body) req.body = parsed.data.body;
      if (parsed.data.query) req.query = parsed.data.query;
      if (parsed.data.params) req.params = parsed.data.params;

      next();
    } catch (error) {
      next(error);
    }
  };
}
