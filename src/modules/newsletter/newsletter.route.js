import { Router } from "express";
import { NewsletterController } from "./newsletter.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Inscription publique
router.post("/subscribe", NewsletterController.subscribe);

// Administration Newsletter (Admin)
router.use(requireAuth);
router.use(restrictTo("admin"));

// Abonnés
router.get("/abonnes", NewsletterController.getAllAbonnes);
router.post("/abonnes", NewsletterController.createAbonne);
router.put("/abonnes/:id", NewsletterController.updateAbonne);
router.delete("/abonnes/:id", NewsletterController.deleteAbonne);

// Campagnes
router.get("/campagnes", NewsletterController.getAllCampagnes);
router.get("/campagnes/:id", NewsletterController.getCampagneById);
router.post("/campagnes", NewsletterController.createCampagne);
router.put("/campagnes/:id", NewsletterController.updateCampagne);
router.post("/campagnes/:id/envoyer", NewsletterController.envoyerCampagne);

// Templates
router.get("/templates", NewsletterController.getAllTemplates);
router.post("/templates", NewsletterController.createTemplate);
router.put("/templates/:id", NewsletterController.updateTemplate);
router.delete("/templates/:id", NewsletterController.deleteTemplate);

export const newsletterRoutes = router;
