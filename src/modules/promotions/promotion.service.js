import { Promotion } from "./promotion.model.js";
import { AppError } from "../../utils/api-error.js";

export class PromotionService {
  static async getAllPromotions({ q, actif } = {}) {
    const filter = {};
    if (actif !== undefined) filter.actif = actif === "true" || actif === true;
    if (q) {
      filter.$or = [
        { nom: { $regex: q, $options: "i" } },
        { cible: { $regex: q, $options: "i" } },
      ];
    }

    const promotions = await Promotion.find(filter).sort({ createdAt: -1 });
    return promotions;
  }

  static async getPromotionById(id) {
    const promotion = await Promotion.findById(id);
    if (!promotion) {
      throw new AppError("Promotion introuvable", 404);
    }
    return promotion;
  }

  static async createPromotion(data) {
    const promotion = await Promotion.create({
      ...data,
      remise: Number(data.remise),
    });
    return promotion;
  }

  static async updatePromotion(id, data) {
    const promotion = await Promotion.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!promotion) {
      throw new AppError("Promotion introuvable", 404);
    }
    return promotion;
  }

  static async deletePromotion(id) {
    const promotion = await Promotion.findByIdAndDelete(id);
    if (!promotion) {
      throw new AppError("Promotion introuvable", 404);
    }
    return promotion;
  }
}
