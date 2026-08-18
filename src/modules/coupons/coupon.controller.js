import { CouponService } from "./coupon.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class CouponController {
  static async getAllCoupons(req, res, next) {
    try {
      const { q, type, actif } = req.query;
      const coupons = await CouponService.getAllCoupons({ q, type, actif });
      return ApiResponse.success(res, coupons, "Coupons récupérés");
    } catch (error) {
      next(error);
    }
  }

  static async getCouponById(req, res, next) {
    try {
      const coupon = await CouponService.getCouponById(req.params.id);
      return ApiResponse.success(res, coupon, "Détail du coupon");
    } catch (error) {
      next(error);
    }
  }

  static async validerCoupon(req, res, next) {
    try {
      const { code, montant } = req.body;
      const result = await CouponService.validerCoupon(code, Number(montant) || 0);
      return ApiResponse.success(res, result, "Coupon valide");
    } catch (error) {
      next(error);
    }
  }

  static async createCoupon(req, res, next) {
    try {
      const coupon = await CouponService.createCoupon(req.body);
      return ApiResponse.created(res, coupon, "Coupon créé avec succès");
    } catch (error) {
      next(error);
    }
  }

  static async updateCoupon(req, res, next) {
    try {
      const coupon = await CouponService.updateCoupon(req.params.id, req.body);
      return ApiResponse.success(res, coupon, "Coupon mis à jour");
    } catch (error) {
      next(error);
    }
  }

  static async deleteCoupon(req, res, next) {
    try {
      await CouponService.deleteCoupon(req.params.id);
      return ApiResponse.success(res, null, "Coupon supprimé");
    } catch (error) {
      next(error);
    }
  }
}
