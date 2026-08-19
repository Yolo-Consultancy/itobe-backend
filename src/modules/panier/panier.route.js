import { Router } from "express";
import { PanierController } from "./panier.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", PanierController.getCart);
router.post("/items", PanierController.addItem);
router.post("/fusionner", PanierController.mergeGuest);
router.post("/checkout", PanierController.checkout);
router.patch("/items/:livreId", PanierController.updateItem);
router.delete("/items/:livreId", PanierController.removeItem);
router.delete("/", PanierController.clearCart);

export const panierRoutes = router;
