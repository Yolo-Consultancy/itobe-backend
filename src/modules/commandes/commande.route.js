import { Router } from "express";
import { CommandeController } from "./commande.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// Routes pour le lecteur connecté
router.get("/mes-commandes", CommandeController.getMyOrders);
router.post("/", CommandeController.createOrder);
router.post("/:id/cancel", CommandeController.cancelOrder);

// Routes de gestion Admin
router.get("/", restrictTo("admin", "editeur"), CommandeController.getAllOrders);
router.get("/:id", CommandeController.getOrderById);
router.put("/:id/statut", restrictTo("admin", "editeur"), CommandeController.updateOrderStatus);

export const commandeRoutes = router;
