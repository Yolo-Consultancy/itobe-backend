import mongoose from "mongoose";

const commandeSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'utilisateur est obligatoire"],
      index: true,
    },
    clientNom: {
      type: String,
      default: "",
    },
    livre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livre",
      required: [true, "Le livre est obligatoire"],
      index: true,
    },
    livreTitre: {
      type: String,
      default: "",
    },
    format: {
      type: String,
      enum: ["EPUB + PDF", "PDF", "Accès en ligne", "Papier"],
      default: "EPUB + PDF",
    },
    moyen: {
      type: String,
      enum: ["Mobile Money", "Carte bancaire"],
      required: [true, "Le moyen de paiement est obligatoire"],
    },
    montant: {
      type: Number,
      required: [true, "Le montant est obligatoire"],
      min: 0,
    },
    frais: {
      type: Number,
      default: 0,
    },
    statut: {
      type: String,
      enum: ["Payée", "En attente", "Échouée", "Remboursée"],
      default: "En attente",
      index: true,
    },
    motif: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const Commande = mongoose.model("Commande", commandeSchema);
