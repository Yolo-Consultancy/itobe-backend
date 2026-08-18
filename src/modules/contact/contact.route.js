import { Router } from "express";
import { ContactController } from "./contact.controller.js";
import { requireAuth, restrictTo } from "../../middleware/auth.middleware.js";

const router = Router();

// Public route to submit a contact message
router.post("/", ContactController.createContact);

// Admin-protected routes
router.use(requireAuth);
router.use(restrictTo("admin"));
router.get("/", ContactController.getAllContacts);

export const contactRoutes = router;
