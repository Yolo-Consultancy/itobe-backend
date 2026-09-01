import path from "path";
import { fileURLToPath } from "url";
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

import { connectDB } from './config/db.config.js';
import { ENV } from './config/env.config.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Import route modules
import { userRoutes } from './modules/users/user.route.js';
import { authRoutes } from './modules/auth/auth.route.js';
import { categoryRoutes } from './modules/categories/category.route.js';
import { auteurRoutes } from './modules/auteurs/auteur.route.js';
import { articleRoutes } from './modules/articles/article.route.js';
import { actualiteRoutes } from './modules/actualites/actualite.route.js';
import { livreRoutes } from './modules/livres/livre.route.js';
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

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Connect to DB
connectDB();

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

app.use('/api/v1', api);

// 404 handler
app.use(notFoundHandler);
// Error handler
app.use(errorHandler);

export default app;
