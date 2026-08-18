import { Coupon } from "./coupon.model.js";
import { AppError } from "../../utils/api-error.js";

export class CouponService {
  static async getAllCoupons({ q, type, actif } = {}) {
    const filter = {};
    if (type && type !== "Tous") filter.type = type;
    if (actif !== undefined) filter.actif = actif === "true" || actif === true;
    if (q) filter.code = { $regex: q, $options: "i" };

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    return coupons;
  }

  static async getCouponById(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError("Coupon introuvable", 404);
    }
    return coupon;
  }

  static async validerCoupon(code, montant = 0) {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      actif: true,
    });

    if (!coupon) {
      throw new AppError("Code coupon invalide ou inactif", 400);
    }

    if (coupon.expiration && new Date() > new Date(coupon.expiration)) {
      throw new AppError("Ce code coupon a expiré", 400);
    }

    if (coupon.maxUtilisations && coupon.utilisations >= coupon.maxUtilisations) {
      throw new AppError("Ce code coupon a atteint sa limite d'utilisation", 400);
    }

    let montantRemise = 0;
    if (coupon.type === "Pourcentage") {
      montantRemise = (montant * coupon.remise) / 100;
    } else {
      montantRemise = Math.min(montant, coupon.remise);
    }

    return {
      valide: true,
      code: coupon.code,
      type: coupon.type,
      remise: coupon.remise,
      montantRemise: Number(montantRemise.toFixed(2)),
      nouveauMontant: Number(Math.max(0, montant - montantRemise).toFixed(2)),
    };
  }

  static async createCoupon(data) {
    const code = data.code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code });
    if (existing) {
      throw new AppError(`Le coupon '${code}' existe déjà`, 409);
    }

    const coupon = await Coupon.create({
      ...data,
      code,
      remise: Number(data.remise),
      utilisations: Number(data.utilisations) || 0,
    });

    return coupon;
  }

  static async updateCoupon(id, data) {
    if (data.code) {
      data.code = data.code.toUpperCase().trim();
    }
    const coupon = await Coupon.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!coupon) {
      throw new AppError("Coupon introuvable", 404);
    }
    return coupon;
  }

  static async deleteCoupon(id) {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw new AppError("Coupon introuvable", 404);
    }
    return coupon;
  }
}
