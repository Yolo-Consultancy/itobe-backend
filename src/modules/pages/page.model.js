import mongoose from "mongoose";
import { extraireTexteTiptap } from "../chapitres/chapitre.model.js";

/**
 * Page éditoriale d'un chapitre.
 *
 * Hiérarchie officielle :
 *   Livre → Chapitre → Page → blocs (Tiptap JSON dans `contenu`)
 *
 * Une Page est une unité éditoriale de contenu (pas une page physique PDF).
 * Les blocs de contenu sont les nœuds Tiptap stockés dans `contenu`.
 * Pas de collection Block en V1.
 */
const pageSchema = new mongoose.Schema(
  {
    chapitre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapitre",
      required: [true, "Le chapitre associé est obligatoire"],
      index: true,
    },
    /** Livre dénormalisé pour requêtes / exports futurs (PDF, EPUB, reader). */
    livre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livre",
      required: [true, "Le livre associé est obligatoire"],
      index: true,
    },
    titre: {
      type: String,
      trim: true,
      default: "",
    },
    ordre: {
      type: Number,
      required: [true, "L'ordre de la page est obligatoire"],
      min: 1,
      default: 1,
    },
    /**
     * Contenu éditorial Tiptap JSON (= blocs de contenu).
     * Ex. { type: "doc", content: [ { type: "paragraph", ... } ] }
     */
    contenu: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ type: "doc", content: [] }),
    },
    revision: {
      type: Number,
      default: 1,
      min: 1,
    },
    tempsLecture: {
      type: String,
      default: "1 min",
    },
    motsCount: {
      type: Number,
      default: 0,
    },
    derniereModificationPar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

/** Un seul ordre par chapitre — empêche les doublons de position. */
pageSchema.index({ chapitre: 1, ordre: 1 }, { unique: true });
pageSchema.index({ livre: 1, chapitre: 1, ordre: 1 });

pageSchema.pre("save", function (next) {
  if (this.isModified("contenu")) {
    const texte = extraireTexteTiptap(this.contenu);
    const mots = texte.trim().split(/\s+/).filter(Boolean).length;
    this.motsCount = mots;
    const minutes = Math.max(1, Math.round(mots / 200));
    this.tempsLecture = `${minutes} min`;
  }
  next();
});

export const Page = mongoose.model("Page", pageSchema);
