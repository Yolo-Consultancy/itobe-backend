import { Abonnement } from "./abonnement.model.js";
import { AppError } from "../../utils/api-error.js";

export class AbonnementService {
  static async getAbonnement(userId) {
    let ab = await Abonnement.findOne({ user: userId });
    if (!ab) {
      ab = await Abonnement.create({
        user: userId,
        formule: "mensuel",
        statut: "inactif",
        renouvellementAutomatique: false,
        factures: [],
      });
    }
    return ab;
  }

  static async souscrire(userId, { formule = "mensuel", moyenPaiement = "Mobile Money" }) {
    let ab = await Abonnement.findOne({ user: userId });
    const now = new Date();
    const echeance = new Date();

    if (formule === "annuel") {
      echeance.setFullYear(echeance.getFullYear() + 1);
    } else {
      echeance.setMonth(echeance.getMonth() + 1);
    }

    const prix = formule === "annuel" ? 59.9 : 6.99;
    const refFacture = `FCT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const nouvelleFacture = {
      reference: refFacture,
      date: now,
      libelle: `Premium ${formule} — ${now.toLocaleDateString("fr-FR", { month: "long" })}`,
      montant: prix,
      statut: "Payée",
      moyen: moyenPaiement,
    };

    if (!ab) {
      ab = await Abonnement.create({
        user: userId,
        formule,
        statut: "actif",
        dateDebut: now,
        prochaineEcheance: echeance,
        renouvellementAutomatique: true,
        moyenPaiement: {
          typeMoyen: moyenPaiement,
          masque: moyenPaiement === "Mobile Money" ? "•••• 4412" : "•••• 4242",
        },
        factures: [nouvelleFacture],
      });
    } else {
      ab.formule = formule;
      ab.statut = "actif";
      ab.dateDebut = now;
      ab.prochaineEcheance = echeance;
      ab.renouvellementAutomatique = true;
      ab.motifAnnulation = "";
      ab.factures.unshift(nouvelleFacture);
      await ab.save();
    }

    return ab;
  }

  static async renouveler(userId) {
    const ab = await Abonnement.findOne({ user: userId });
    if (!ab) {
      throw new AppError("Aucun abonnement existant", 404);
    }

    const now = new Date();
    const echeance = new Date(ab.prochaineEcheance || now);
    if (ab.formule === "annuel") {
      echeance.setFullYear(echeance.getFullYear() + 1);
    } else {
      echeance.setMonth(echeance.getMonth() + 1);
    }

    const prix = ab.formule === "annuel" ? 59.9 : 6.99;
    const refFacture = `FCT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    ab.statut = "actif";
    ab.prochaineEcheance = echeance;
    ab.renouvellementAutomatique = true;
    ab.factures.unshift({
      reference: refFacture,
      date: now,
      libelle: `Premium ${ab.formule} — ${now.toLocaleDateString("fr-FR", { month: "long" })}`,
      montant: prix,
      statut: "Payée",
      moyen: ab.moyenPaiement?.typeMoyen || "Mobile Money",
    });

    await ab.save();
    return ab;
  }

  static async toggleAutoRenewal(userId) {
    const ab = await Abonnement.findOne({ user: userId });
    if (!ab) {
      throw new AppError("Aucun abonnement existant", 404);
    }
    ab.renouvellementAutomatique = !ab.renouvellementAutomatique;
    await ab.save();
    return ab;
  }

  static async annuler(userId, { motif = "Autre" } = {}) {
    const ab = await Abonnement.findOne({ user: userId });
    if (!ab) {
      throw new AppError("Aucun abonnement existant", 404);
    }

    ab.statut = "annule";
    ab.renouvellementAutomatique = false;
    ab.motifAnnulation = motif;
    await ab.save();

    return ab;
  }

  static async getFactures(userId) {
    const ab = await this.getAbonnement(userId);
    return ab.factures;
  }
}
