import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/visitors", DashboardController.trackVisitor);

// Protect the dashboard – only admin / editeur can access
router.use(requireAuth);
router.use(restrictTo("admin", "editeur"));

router.get("/", DashboardController.getStats);
router.get("/visitors", restrictTo("admin", "editeur"), DashboardController.getVisitorStats);

export const dashboardRoutes = router;
