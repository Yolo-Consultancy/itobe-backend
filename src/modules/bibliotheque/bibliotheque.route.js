import { Router } from "express";
import { BibliothequeController } from "./bibliotheque.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", BibliothequeController.getLibrary);
router.post("/favoris/:slug", BibliothequeController.toggleFavori);
router.post("/telechargements/:slug", BibliothequeController.registerDownload);
router.put("/progression", BibliothequeController.updateProgress);
router.post("/marque-pages", BibliothequeController.manageBookmarks);
router.post("/sync", BibliothequeController.syncDevices);
router.get("/acces/:slug", BibliothequeController.checkAccess);

export const bibliothequeRoutes = router;
