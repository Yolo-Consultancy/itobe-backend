import { Commande } from "./commande.model.js";
import { Livre } from "../livres/livre.model.js";
import { User } from "../users/user.model.js";
import { Paiement } from "../paiements/paiement.model.js";
import { BibliothequeService } from "../bibliotheque/bibliotheque.service.js";
import { Coupon } from "../coupons/coupon.model.js";
import { AppError } from "../../utils/api-error.js";

export class CommandeService {
  static async getUserOrders(userId, { statut } = {}) {
    const filter = { user: userId };
    if (statut && statut !== "Toutes") filter.statut = statut;

    const commandes = await Commande.find(filter)
      .populate("livre", "titre slug auteur couverture couleur formats")
      .sort({ date: -1 });

    return commandes;
  }

  static async getAllOrders({ page = 1, limit = 20, statut, moyen, q } = {}) {
    const filter = {};
    if (statut && statut !== "Tous") filter.statut = statut;
    if (moyen && moyen !== "Tous") filter.moyen = moyen;

    if (q) {
      filter.$or = [
        { reference: { $regex: q, $options: "i" } },
        { clientNom: { $regex: q, $options: "i" } },
        { livreTitre: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [commandes, total] = await Promise.all([
      Commande.find(filter)
        .populate("user", "nom prenom email")
        .populate("livre", "titre slug prix")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Commande.countDocuments(filter),
    ]);

    return {
      commandes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getOrderById(id) {
    const commande = await Commande.findById(id)
      .populate("user", "nom prenom email telephone")
      .populate("livre", "titre slug auteur formats prix couverture");

    if (!commande) {
      throw new AppError("Commande introuvable", 404);
    }
    return commande;
  }

  static async createOrder({ userId, livreSlugOrId, moyen, format, operateur, telephone, couponCode }) {
    let livre = await Livre.findOne({ slug: livreSlugOrId });
    if (!livre && livreSlugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      livre = await Livre.findById(livreSlugOrId);
    }

    if (!livre) {
      throw new AppError("Livre introuvable", 404);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }

    let prixBase = livre.promo ?? livre.prix;
    const frais = moyen === "Carte bancaire" ? 0.5 : 0.2;

    // Application coupon si fourni
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        actif: true,
        $or: [{ expiration: { $gte: new Date() } }, { expiration: null }],
      });
      if (coupon) {
        if (coupon.type === "Pourcentage") {
          prixBase = Math.max(0, prixBase * (1 - coupon.remise / 100));
        } else {
          prixBase = Math.max(0, prixBase - coupon.remise);
        }
        coupon.utilisations += 1;
        await coupon.save();
      }
    }

    const total = Number((prixBase + frais).toFixed(2));
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const reference = `CMD-${randomSuffix}`;

    // Pour la simulation de démo, si les paramètres sont fournis, statut = Payée
    const statutPaiement = "Payée";

    const commande = await Commande.create({
      reference,
      user: user._id,
      clientNom: `${user.prenom} ${user.nom}`.trim() || user.email,
      livre: livre._id,
      livreTitre: livre.titre,
      format: format || "EPUB + PDF",
      moyen: moyen || "Mobile Money",
      montant: total,
      frais,
      statut: statutPaiement,
      date: new Date(),
    });

    // Création de l'enregistrement de paiement
    const payRef = `PAY-${randomSuffix}`;
    await Paiement.create({
      reference: payRef,
      commande: commande._id,
      moyen: commande.moyen,
      operateur: operateur || (moyen === "Mobile Money" ? "M-Pesa" : "Visa"),
      telephone: telephone || user.telephone || "",
      montant: total,
      statut: statutPaiement,
      date: new Date(),
    });

    // Si payée, ajouter immédiatement à la bibliothèque de l'utilisateur
    if (statutPaiement === "Payée") {
      await BibliothequeService.ajouterLivreAchete(user._id, livre._id);
      livre.ventesCount += 1;
      await livre.save({ validateBeforeSave: false });
    }

    return commande;
  }

  static async updateOrderStatus(id, { statut, motif }) {
    const commande = await Commande.findById(id);
    if (!commande) {
      throw new AppError("Commande introuvable", 404);
    }

    const ancienStatut = commande.statut;
    commande.statut = statut;
    if (motif) commande.motif = motif;
    await commande.save();

    // Si statut passe à "Payée", débloquer le livre dans la bibliothèque
    if (statut === "Payée" && ancienStatut !== "Payée") {
      await BibliothequeService.ajouterLivreAchete(commande.user, commande.livre);
    }

    return commande;
  }

  static async cancelOrder(id, userId) {
    const commande = await Commande.findOne({ _id: id, user: userId });
    if (!commande) {
      throw new AppError("Commande introuvable", 404);
    }

    if (commande.statut === "Payée") {
      throw new AppError("Impossible d'annuler une commande déjà payée directement. Veuillez contacter le support.", 400);
    }

    commande.statut = "Remboursée";
    commande.motif = "Annulée par le client";
    await commande.save();

    return commande;
  }
}
