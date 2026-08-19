import mongoose from "mongoose";

const panierItemSchema = new mongoose.Schema(
  {
    livre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livre",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    format: {
      type: String,
      enum: ["EPUB + PDF", "PDF", "Accès en ligne", "Papier"],
      default: "EPUB + PDF",
    },
    /** Prix unitaire figé au moment de l'ajout (promo si applicable). */
    prixUnitaire: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const panierSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [panierItemSchema],
      default: [],
    },
    sousTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

export const Panier = mongoose.model("Panier", panierSchema);
