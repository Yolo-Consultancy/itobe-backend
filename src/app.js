import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

import { connectDB } from './config/db.config.js';
import { ENV } from './config/env.config.js';
import { isCloudinaryConfigured } from './utils/cloudinary.service.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Import route modules
import { userRoutes } from './modules/users/user.route.js';
import { authRoutes } from './modules/auth/auth.route.js';
import { categoryRoutes } from './modules/categories/category.route.js';
import { auteurRoutes } from './modules/auteurs/auteur.route.js';
import { articleRoutes } from './modules/articles/article.route.js';
import { actualiteRoutes } from './modules/actualites/actualite.route.js';
import { livreRoutes } from './modules/livres/livre.route.js';
import { chapitreRoutes } from './modules/chapitres/chapitre.route.js';
import { pageRoutes } from './modules/pages/page.route.js';
import { mediaRoutes } from './modules/medias/media.route.js';
import { commandeRoutes } from './modules/commandes/commande.route.js';
import { panierRoutes } from './modules/panier/panier.route.js';
import { paiementRoutes } from './modules/paiements/paiement.route.js';
import { abonnementRoutes } from './modules/abonnements/abonnement.route.js';
import { couponRoutes } from './modules/coupons/coupon.route.js';
import { promotionRoutes } from './modules/promotions/promotion.route.js';
import { newsletterRoutes } from './modules/newsletter/newsletter.route.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.route.js';
import { bibliothequeRoutes } from './modules/bibliotheque/bibliotheque.route.js';
import { calendrierRoutes } from './modules/calendrier/calendrier.route.js';
import { commentaireRoutes } from './modules/commentaires/commentaire.route.js';
import { contactRoutes } from './modules/contact/contact.route.js';
import { rechercheRoutes } from './modules/recherche/recherche.route.js';
import { youtubeRoutes } from './modules/youtube/youtube.route.js';

const app = express();

/** Origines front autorisées (dev multi-ports). */
const corsOrigins = [
  ENV.CLIENT_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Outils sans Origin (curl, SSR, Postman) + origines front connues
    if (!origin || corsOrigins.includes(origin) || ENV.NODE_ENV === "development") {
      callback(null, true);
      return;
    }
    callback(new Error(`Origine CORS refusée: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

// Middleware — CORS avant Helmet pour les preflight OPTIONS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (ENV.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Connect to DB
connectDB();

if (isCloudinaryConfigured()) {
  console.log("[Cloudinary] Configuré — les médias sont stockés sur Cloudinary.");
} else {
  console.warn(
    "[Cloudinary] Non configuré. Définissez CLOUDINARY_* dans .env pour téléverser des images.",
  );
}

// Base API path
const api = express.Router();

// Register routes
api.use('/users', userRoutes);
api.use('/auth', authRoutes);
api.use('/categories', categoryRoutes);
api.use('/auteurs', auteurRoutes);
api.use('/articles', articleRoutes);
api.use('/actualites', actualiteRoutes);
api.use('/livres', livreRoutes);
api.use('/chapitres', chapitreRoutes);
api.use('/pages', pageRoutes);
api.use('/medias', mediaRoutes);

api.use('/commandes', commandeRoutes);
api.use('/panier', panierRoutes);
api.use('/paiements', paiementRoutes);
api.use('/abonnements', abonnementRoutes);
api.use('/coupons', couponRoutes);
api.use('/promotions', promotionRoutes);
api.use('/newsletter', newsletterRoutes);
api.use('/dashboard', dashboardRoutes);
api.use('/bibliotheque', bibliothequeRoutes);
api.use('/calendrier', calendrierRoutes);
api.use('/commentaires', commentaireRoutes);
api.use('/contact', contactRoutes);
api.use('/recherche', rechercheRoutes);
api.use('/youtube', youtubeRoutes);

app.use('/api/v1', api);

// 404 handler
app.use(notFoundHandler);
// Error handler
app.use(errorHandler);

export default app;
