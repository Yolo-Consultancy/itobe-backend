import { Router } from "express";
import { PaiementController } from "./paiement.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(restrictTo("admin"));

router.get("/", PaiementController.getAllPaiements);
router.get("/:id", PaiementController.getPaiementById);
router.post("/", PaiementController.createPaiement);
router.put("/:id/statut", PaiementController.updateStatut);

export const paiementRoutes = router;
