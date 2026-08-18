import { Router } from "express";
import { CalendrierController } from "./calendrier.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Endpoint d'administration du calendrier éditorial
router.get("/", requireAuth, restrictTo("admin", "editeur"), CalendrierController.getEditorialCalendar);

export const calendrierRoutes = router;
