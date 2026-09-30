import { Router } from "express";
import { CouponController } from "./coupon.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Validation publique de coupon lors de l'achat
router.post("/valider", CouponController.validerCoupon);

// Gestion administrative
router.use(requireAuth);
router.use(restrictTo("admin", "editeur"));

router.get("/", CouponController.getAllCoupons);
router.get("/:id", CouponController.getCouponById);
router.post("/", CouponController.createCoupon);
router.put("/:id", CouponController.updateCoupon);
router.delete("/:id", CouponController.deleteCoupon);

export const couponRoutes = router;
