import mongoose from "mongoose";

const factureSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true }, // FCT-2026-07
    date: { type: Date, default: Date.now },
    libelle: { type: String, required: true },
    montant: { type: Number, required: true },
    statut: { type: String, enum: ["Payée", "En attente", "Échouée"], default: "Payée" },
    moyen: { type: String, enum: ["Mobile Money", "Carte bancaire"], default: "Mobile Money" },
  },
  { _id: true }
);

const abonnementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    formule: {
      type: String,
      enum: ["mensuel", "annuel"],
      default: "mensuel",
    },
    statut: {
      type: String,
      enum: ["inactif", "actif", "annule"],
      default: "inactif",
    },
    dateDebut: {
      type: Date,
      default: Date.now,
    },
    prochaineEcheance: {
      type: Date,
    },
    renouvellementAutomatique: {
      type: Boolean,
      default: true,
    },
    moyenPaiement: {
      typeMoyen: { type: String, enum: ["Mobile Money", "Carte bancaire"], default: "Mobile Money" },
      masque: { type: String, default: "•••• 4412" },
    },
    motifAnnulation: {
      type: String,
      default: "",
    },
    factures: [factureSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const Abonnement = mongoose.model("Abonnement", abonnementSchema);
