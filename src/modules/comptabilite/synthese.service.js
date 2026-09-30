import { Commande } from "../commandes/commande.model.js";
import { Paiement } from "../paiements/paiement.model.js";
import { AppError } from "../../utils/api-error.js";

const CATEGORIES = ["toutes", "vente", "paiement", "depense"];

async function total(statut) {
  const [ligne] = await Commande.aggregate([
    { $match: { statut } },
    { $group: { _id: null, livres: { $sum: 1 }, montant: { $sum: "$montant" } } },
  ]);
  return { livres: ligne?.livres ?? 0, montant: ligne?.montant ?? 0 };
}

/** Clients regroupés depuis les commandes de livres. */
export async function listeClients() {
  const lignes = await Commande.aggregate([
    {
      $group: {
        _id: "$user",
        nom: { $first: "$clientNom" },
        livresVendus: { $sum: { $cond: [{ $eq: ["$statut", "Payée"] }, 1, 0] } },
        paye: { $sum: { $cond: [{ $eq: ["$statut", "Payée"] }, "$montant", 0] } },
        enAttente: { $sum: { $cond: [{ $eq: ["$statut", "En attente"] }, "$montant", 0] } },
        commandes: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "compte",
      },
    },
    { $sort: { paye: -1, nom: 1 } },
  ]);

  return lignes.map((ligne) => {
    const compte = ligne.compte?.[0];
    const nomCompte = `${compte?.prenom ?? ""} ${compte?.nom ?? ""}`.trim();
    return {
      id: String(ligne._id),
      nom: ligne.nom || nomCompte || compte?.email || "Client",
      email: compte?.email ?? "",
      livresVendus: ligne.livresVendus,
      paye: ligne.paye,
      enAttente: ligne.enAttente,
      commandes: ligne.commandes,
    };
  });
}

function periode(debut, fin) {
  const start = new Date(`${debut}T00:00:00`);
  const end = new Date(`${fin}T23:59:59.999`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new AppError("Choisissez une date de début et une date de fin valides.", 400);
  }
  return { start, end };
}

function jour(date) {
  return new Date(date).toISOString().slice(0, 10);
}

/** Rapport d'une période. Les dépenses n'ont pas encore de pièces enregistrées. */
export async function rapportPeriode({ debut, fin, categorie = "toutes" }) {
  if (!CATEGORIES.includes(categorie)) {
    throw new AppError("Catégorie de rapport inconnue.", 400);
  }
  const { start, end } = periode(debut, fin);
  const filtreDate = { $gte: start, $lte: end };

  const [commandes, paiements] = await Promise.all([
    categorie === "paiement" || categorie === "depense"
      ? []
      : Commande.find({ statut: "Payée", date: filtreDate })
          .select("reference date clientNom livreTitre montant")
          .sort({ date: 1 })
          .lean(),
    categorie === "paiement"
      ? Paiement.find({ statut: "Payée", date: filtreDate })
          .select("reference date moyen montant")
          .sort({ date: 1 })
          .lean()
      : [],
  ]);

  const ventes = commandes.map((ligne) => ({
    date: jour(ligne.date),
    reference: ligne.reference,
    libelle: [ligne.livreTitre, ligne.clientNom].filter(Boolean).join(" — ") || "Vente de livre",
    categorie: "vente",
    montant: ligne.montant,
  }));
  const encaissements = paiements.map((ligne) => ({
    date: jour(ligne.date),
    reference: ligne.reference,
    libelle: ligne.moyen || "Paiement",
    categorie: "paiement",
    montant: ligne.montant,
  }));

  const lignes =
    categorie === "vente" ? ventes : categorie === "paiement" ? encaissements : categorie === "depense" ? [] : [...ventes];

  const totalVentes = ventes.reduce((somme, ligne) => somme + ligne.montant, 0);
  const totalPaiements = encaissements.reduce((somme, ligne) => somme + ligne.montant, 0);
  const totalDepenses = 0;
  const total =
    categorie === "paiement" ? totalPaiements : categorie === "depense" ? totalDepenses : totalVentes - totalDepenses;

  return {
    debut,
    fin,
    categorie,
    lignes,
    totalVentes: categorie === "paiement" || categorie === "depense" ? 0 : totalVentes,
    totalPaiements: categorie === "vente" || categorie === "depense" ? 0 : totalPaiements,
    totalDepenses,
    total,
  };
}

/** Chiffres d'argent tirés des commandes de livres déjà enregistrées. */
export async function syntheseArgent() {
  const [payees, attente, remboursees] = await Promise.all([
    total("Payée"),
    total("En attente"),
    total("Remboursée"),
  ]);
  return {
    livresVendus: payees.livres,
    soldeCaisse: payees.montant,
    enAttente: attente.montant,
    commandesEnAttente: attente.livres,
    rembourse: remboursees.montant,
  };
}
