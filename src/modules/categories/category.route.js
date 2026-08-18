import { Router } from "express";
import { CategoryController } from "./category.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Routes publiques
router.get("/", CategoryController.getCategories);
router.get("/:id", CategoryController.getCategoryById);

// Routes protégées (admin / editeur)
router.use(requireAuth);
router.use(restrictTo("admin", "editeur"));

router.post("/", CategoryController.createCategory);
router.put("/:id", CategoryController.updateCategory);
router.delete("/:id", restrictTo("admin"), CategoryController.deleteCategory);

export const categoryRoutes = router;
