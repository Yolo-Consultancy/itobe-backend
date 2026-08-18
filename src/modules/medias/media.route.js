import { Router } from "express";
import { MediaController } from "./media.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(restrictTo("admin", "editeur"));

router.get("/", MediaController.getAllMedias);
router.post("/upload", upload.single("file"), MediaController.uploadFile);
router.post("/", MediaController.createMediaManuel);
router.delete("/:id", MediaController.deleteMedia);

export const mediaRoutes = router;
