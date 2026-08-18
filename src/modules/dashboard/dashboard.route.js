import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Protect the dashboard – only admin / editeur can access
router.use(requireAuth);
router.use(restrictTo("admin", "editeur"));

router.get("/", DashboardController.getStats);

export const dashboardRoutes = router;
