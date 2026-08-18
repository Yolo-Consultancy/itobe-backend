import mongoose from "mongoose";

const paiementSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    commande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commande",
      required: true,
      index: true,
    },
    moyen: {
      type: String,
      enum: ["Mobile Money", "Carte bancaire"],
      required: true,
    },
    operateur: {
      type: String,
      default: "M-Pesa",
    },
    telephone: {
      type: String,
      default: "",
    },
    montant: {
      type: Number,
      required: true,
      min: 0,
    },
    statut: {
      type: String,
      enum: ["Payée", "En attente", "Échouée"],
      default: "En attente",
      index: true,
    },
    transactionRef: {
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

export const Paiement = mongoose.model("Paiement", paiementSchema);
