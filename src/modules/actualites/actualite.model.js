import mongoose from "mongoose";

const actualiteSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      trim: true,
    },
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },
    categorieNom: {
      type: String,
      default: "Actualités",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    etat: {
      type: String,
      enum: ["Brouillon", "En revue", "Publié", "Rejeté"],
      default: "Publié",
    },
    contenu: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const Actualite = mongoose.model("Actualite", actualiteSchema);
