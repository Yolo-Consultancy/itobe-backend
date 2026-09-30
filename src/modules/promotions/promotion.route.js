import { Router } from "express";
import { PromotionController } from "./promotion.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Route publique
router.get("/", PromotionController.getAllPromotions);
router.get("/:id", PromotionController.getPromotionById);

// Routes protégées Admin
router.use(requireAuth);
router.use(restrictTo("admin", "editeur"));

router.post("/", PromotionController.createPromotion);
router.put("/:id", PromotionController.updatePromotion);
router.delete("/:id", PromotionController.deletePromotion);

export const promotionRoutes = router;
