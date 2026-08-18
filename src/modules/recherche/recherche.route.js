import { Router } from "express";
import { RechercheController } from "./recherche.controller.js";

const router = Router();

// Public – recherche globale
router.get("/", RechercheController.search);

export const rechercheRoutes = router;
