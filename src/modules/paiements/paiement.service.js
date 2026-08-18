import { Paiement } from "./paiement.model.js";
import { Commande } from "../commandes/commande.model.js";
import { AppError } from "../../utils/api-error.js";

export class PaiementService {
  static async getAllPaiements({ page = 1, limit = 20, statut, moyen, q } = {}) {
    const filter = {};
    if (statut && statut !== "Tous") filter.statut = statut;
    if (moyen && moyen !== "Tous") filter.moyen = moyen;

    if (q) {
      filter.$or = [
        { reference: { $regex: q, $options: "i" } },
        { telephone: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [paiements, total] = await Promise.all([
      Paiement.find(filter)
        .populate("commande", "reference clientNom livreTitre montant")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Paiement.countDocuments(filter),
    ]);

    return {
      paiements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getPaiementById(id) {
    const paiement = await Paiement.findById(id).populate("commande");
    if (!paiement) {
      throw new AppError("Transaction introuvable", 404);
    }
    return paiement;
  }

  static async createPaiement(data) {
    const paiement = await Paiement.create(data);
    return paiement;
  }

  static async updatePaiementStatut(id, statut) {
    const paiement = await Paiement.findById(id);
    if (!paiement) {
      throw new AppError("Transaction introuvable", 404);
    }
    paiement.statut = statut;
    await paiement.save();

    // Mettre à jour la commande associée
    if (paiement.commande) {
      await Commande.findByIdAndUpdate(paiement.commande, { statut });
    }

    return paiement;
  }
}
