import { Router } from "express";
import { PageController } from "./page.controller.js";
import { requireAuth, optionalAuth } from "../../middleware/auth.middleware.js";

const router = Router();

/**
 * Routes Pages éditoriales
 *
 * Sous-routes chapitre (montées aussi depuis chapitre.route) :
 *   GET    /chapitres/:chapitreId/pages
 *   POST   /chapitres/:chapitreId/pages
 *   PUT    /chapitres/:chapitreId/pages/reordonner
 *
 * Par ID :
 *   GET    /pages/:id
 *   PUT    /pages/:id
 *   DELETE /pages/:id
 */
router.get("/:id", optionalAuth, PageController.getPageById);
router.put("/:id", requireAuth, PageController.updatePage);
router.delete("/:id", requireAuth, PageController.deletePage);

export const pageRoutes = router;

/** Sous-routes montées sous /chapitres/:chapitreId/pages */
export const pageChapitreRoutes = Router({ mergeParams: true });

pageChapitreRoutes.get("/", optionalAuth, PageController.getPagesByChapitre);
pageChapitreRoutes.post("/", requireAuth, PageController.createPage);
pageChapitreRoutes.put("/reordonner", requireAuth, PageController.reordonnerPages);
