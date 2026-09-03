import mongoose from "mongoose";

const versionChapitreSchema = new mongoose.Schema(
  {
    chapitre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapitre",
      required: [true, "Le chapitre associé est obligatoire"],
      index: true,
    },
    livre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livre",
      required: [true, "Le livre associé est obligatoire"],
      index: true,
    },
    revision: {
      type: Number,
      required: [true, "Le numéro de révision est obligatoire"],
    },
    titre: {
      type: String,
      required: [true, "Le titre est obligatoire pour la version"],
      trim: true,
    },
    contenu: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Le contenu de la version est obligatoire"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    creePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

versionChapitreSchema.index({ chapitre: 1, revision: -1 });
versionChapitreSchema.index({ livre: 1, createdAt: -1 });

export const VersionChapitre = mongoose.model("VersionChapitre", versionChapitreSchema);
