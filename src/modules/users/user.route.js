import { Router } from "express";
import { UserController } from "./user.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Toutes les routes utilisateurs de gestion sont protégées et réservées à l'administrateur
router.use(requireAuth);
router.use(restrictTo("admin", "editeur"));

router.get("/permissions", UserController.getPermissions);
router.put("/permissions", UserController.updatePermission);

router.route("/")
  .get(UserController.getAllUsers)
  .post(UserController.createUser);

router.route("/:id")
  .get(UserController.getUserById)
  .put(UserController.updateUser)
  .delete(UserController.deleteUser);

export const userRoutes = router;
