import { Panier } from "./panier.model.js";
import { Livre } from "../livres/livre.model.js";
import { CommandeService } from "../commandes/commande.service.js";
import { AppError } from "../../utils/api-error.js";

function prixEffectif(livre) {
  const promo = livre.promo;
  if (promo != null && promo > 0 && promo < livre.prix) return promo;
  return livre.prix;
}

async function resolveLivre(livreSlugOrId) {
  let livre = await Livre.findOne({ slug: livreSlugOrId });
  if (!livre && String(livreSlugOrId).match(/^[0-9a-fA-F]{24}$/)) {
    livre = await Livre.findById(livreSlugOrId);
  }
  if (!livre) throw new AppError("Livre introuvable", 404);
  if (!livre.disponible) throw new AppError("Ce livre n'est pas disponible à l'achat", 400);
  return livre;
}

function assertAchetable(livre, format) {
  if (format === "Papier" && livre.stock <= 0) {
    throw new AppError("Stock épuisé pour le format papier", 400);
  }
  if (!livre.formats?.length) return;
  const map = {
    "EPUB + PDF": ["PDF", "EPUB"],
    PDF: ["PDF"],
    "Accès en ligne": ["PDF", "EPUB"],
    Papier: ["Papier"],
  };
  const requis = map[format] || [];
  if (requis.length && !requis.some((f) => livre.formats.includes(f))) {
    throw new AppError(`Format « ${format} » indisponible pour ce livre`, 400);
  }
}

function recalcTotals(panier) {
  panier.sousTotal = panier.items.reduce(
    (acc, i) => acc + i.prixUnitaire * i.quantity,
    0,
  );
  panier.total = Number(panier.sousTotal.toFixed(2));
}

function formatPanierResponse(panier) {
  const items = (panier.items || []).map((item) => {
    const livre = item.livre;
    const populated = livre && typeof livre === "object" && livre._id;
    return {
      livreId: populated ? livre._id : item.livre,
      slug: populated ? livre.slug : undefined,
      titre: populated ? livre.titre : undefined,
      auteur: populated ? livre.auteur : undefined,
      couverture: populated ? livre.couverture : undefined,
      couleur: populated ? livre.couleur : undefined,
      quantity: item.quantity,
      format: item.format,
      prixUnitaire: item.prixUnitaire,
      ligneTotal: Number((item.prixUnitaire * item.quantity).toFixed(2)),
    };
  });

  return {
    id: panier._id,
    items,
    sousTotal: panier.sousTotal,
    total: panier.total,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    updatedAt: panier.updatedAt,
  };
}

export class PanierService {
  static async getOrCreate(userId) {
    let panier = await Panier.findOne({ user: userId }).populate({
      path: "items.livre",
      populate: { path: "auteur", select: "nom slug" },
    });
    if (!panier) {
      panier = await Panier.create({ user: userId, items: [], sousTotal: 0, total: 0 });
      await panier.populate({
        path: "items.livre",
        populate: { path: "auteur", select: "nom slug" },
      });
    }
    return formatPanierResponse(panier);
  }

  static async addItem(userId, { livreSlugOrId, livreId, quantity = 1, format = "EPUB + PDF" }) {
    const ref = livreSlugOrId || livreId;
    const livre = await resolveLivre(ref);
    assertAchetable(livre, format);

    const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
    let panier = await Panier.findOne({ user: userId });
    if (!panier) {
      panier = new Panier({ user: userId, items: [] });
    }

    const prix = prixEffectif(livre);
    const existing = panier.items.find(
      (i) => String(i.livre) === String(livre._id) && i.format === format,
    );

    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + qty);
      existing.prixUnitaire = prix;
    } else {
      panier.items.push({
        livre: livre._id,
        quantity: qty,
        format,
        prixUnitaire: prix,
      });
    }

    recalcTotals(panier);
    await panier.save();
    await panier.populate({
      path: "items.livre",
      populate: { path: "auteur", select: "nom slug" },
    });
    return formatPanierResponse(panier);
  }

  static async updateItem(userId, livreId, { quantity, format }) {
    const panier = await Panier.findOne({ user: userId });
    if (!panier) throw new AppError("Panier introuvable", 404);

    const idx = panier.items.findIndex((i) => String(i.livre) === String(livreId));
    if (idx === -1) throw new AppError("Article absent du panier", 404);

    const livre = await Livre.findById(livreId);
    if (!livre) throw new AppError("Livre introuvable", 404);
    if (!livre.disponible) throw new AppError("Ce livre n'est plus disponible", 400);

    const item = panier.items[idx];
    if (format) {
      assertAchetable(livre, format);
      item.format = format;
    }
    if (quantity != null) {
      const qty = Number(quantity);
      if (qty < 1) {
        panier.items.splice(idx, 1);
      } else {
        item.quantity = Math.min(99, qty);
      }
    }
    item.prixUnitaire = prixEffectif(livre);

    recalcTotals(panier);
    await panier.save();
    await panier.populate({
      path: "items.livre",
      populate: { path: "auteur", select: "nom slug" },
    });
    return formatPanierResponse(panier);
  }

  static async removeItem(userId, livreId) {
    const panier = await Panier.findOne({ user: userId });
    if (!panier) throw new AppError("Panier introuvable", 404);

    panier.items = panier.items.filter((i) => String(i.livre) !== String(livreId));
    recalcTotals(panier);
    await panier.save();
    await panier.populate({
      path: "items.livre",
      populate: { path: "auteur", select: "nom slug" },
    });
    return formatPanierResponse(panier);
  }

  static async clear(userId) {
    const panier = await Panier.findOne({ user: userId });
    if (!panier) {
      return { id: null, items: [], sousTotal: 0, total: 0, itemCount: 0 };
    }
    panier.items = [];
    panier.sousTotal = 0;
    panier.total = 0;
    await panier.save();
    return formatPanierResponse(panier);
  }

  /** Fusionne les articles du panier invité (localStorage) après connexion. */
  static async mergeGuestItems(userId, guestItems = []) {
    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return this.getOrCreate(userId);
    }

    for (const g of guestItems) {
      try {
        await this.addItem(userId, {
          livreSlugOrId: g.slug || g.livreId || g.livre,
          quantity: g.quantity || 1,
          format: g.format || "EPUB + PDF",
        });
      } catch {
        /* ignorer les articles invalides */
      }
    }
    return this.getOrCreate(userId);
  }

  static async checkout(userId, { moyen, operateur, telephone, couponCode } = {}) {
    const panier = await Panier.findOne({ user: userId }).populate("items.livre");
    if (!panier || panier.items.length === 0) {
      throw new AppError("Votre panier est vide", 400);
    }

    const commandes = [];
    for (const item of panier.items) {
      const livre = item.livre;
      if (!livre?.disponible) {
        throw new AppError(`« ${livre?.titre || "Livre"} » n'est plus disponible`, 400);
      }
      assertAchetable(livre, item.format);

      const commande = await CommandeService.createOrder({
        userId,
        livreSlugOrId: livre.slug,
        moyen: moyen || "Mobile Money",
        format: item.format,
        operateur,
        telephone,
        couponCode: commandes.length === 0 ? couponCode : undefined,
      });
      commandes.push(commande);
    }

    panier.items = [];
    panier.sousTotal = 0;
    panier.total = 0;
    await panier.save();

    return {
      commandes,
      count: commandes.length,
    };
  }
}
