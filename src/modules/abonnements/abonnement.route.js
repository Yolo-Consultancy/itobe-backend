import { Router } from "express";
import { AbonnementController } from "./abonnement.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/mon-abonnement", AbonnementController.getMonAbonnement);
router.post("/souscrire", AbonnementController.souscrire);
router.post("/renouveler", AbonnementController.renouveler);
router.post("/toggle-auto", AbonnementController.toggleAutoRenewal);
router.post("/annuler", AbonnementController.annuler);
router.get("/factures", AbonnementController.getFactures);

export const abonnementRoutes = router;
