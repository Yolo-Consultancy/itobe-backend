import { Router } from "express";
import { ActualiteController } from "./actualite.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Route publique
router.get("/", ActualiteController.getAllActualites);
router.get("/:id", ActualiteController.getActualiteById);

// Routes d'administration
router.use(requireAuth);
router.use(restrictTo("admin"));

router.post("/", ActualiteController.createActualite);
router.put("/:id", ActualiteController.updateActualite);
router.delete("/:id", ActualiteController.deleteActualite);

export const actualiteRoutes = router;
