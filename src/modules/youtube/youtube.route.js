import { Router } from "express";
import { YoutubeController } from "./youtube.controller.js";

const router = Router();

router.get("/status", YoutubeController.getStatus);
router.get("/videos", YoutubeController.getVideos);

export const youtubeRoutes = router;
