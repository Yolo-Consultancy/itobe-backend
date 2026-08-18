import mongoose from "mongoose";

const commentaireSchema = new mongoose.Schema(
  {
    auteurNom: {
      type: String,
      required: [true, "Le nom de l'auteur du commentaire est obligatoire"],
      trim: true,
    },
    auteurEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cible: {
      type: String,
      enum: ["article", "livre"],
      required: [true, "La cible du commentaire est obligatoire"],
    },
    cibleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "L'identifiant de la cible est obligatoire"],
      refPath: "cibleModel",
      index: true,
    },
    cibleModel: {
      type: String,
      enum: ["Article", "Livre"],
      required: true,
    },
    contenu: {
      type: String,
      required: [true, "Le contenu du commentaire est obligatoire"],
      trim: true,
      maxlength: [2000, "Le commentaire ne peut pas dépasser 2000 caractères"],
    },
    note: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    statut: {
      type: String,
      enum: ["En attente", "Publié", "Rejeté"],
      default: "En attente",
      index: true,
    },
    ip: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const Commentaire = mongoose.model("Commentaire", commentaireSchema);
