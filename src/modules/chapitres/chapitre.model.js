import mongoose from "mongoose";
import { slugify } from "../../utils/slugify.js";

/**
 * Extrait tout le texte brut contenu dans un document JSON Tiptap
 */
export function extraireTexteTiptap(noeud) {
  if (!noeud) return "";
  if (typeof noeud === "string") return noeud;
  if (Array.isArray(noeud)) {
    return noeud.map(extraireTexteTiptap).filter(Boolean).join(" ");
  }
  if (noeud.text) return noeud.text;
  if (Array.isArray(noeud.content)) {
    return noeud.content.map(extraireTexteTiptap).filter(Boolean).join(" ");
  }
  return "";
}

const chapitreSchema = new mongoose.Schema(
  {
    livre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livre",
      required: [true, "Le livre associé est obligatoire"],
      index: true,
    },
    titre: {
      type: String,
      required: [true, "Le titre du chapitre est obligatoire"],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    ordre: {
      type: Number,
      default: 1,
      min: 0,
    },
    /**
     * @deprecated LEGACY — source de vérité du contenu = Page.contenu
     * Conservé en V1 pour compatibilité reader / anciens chapitres.
     * Ne plus écrire le contenu éditorial ici pour les nouveaux flux.
     * Suppression prévue après migration complète + adaptation du reader.
     */
    contenu: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ type: "doc", content: [] }),
    },
    statut: {
      type: String,
      enum: {
        values: ["Brouillon", "En revue", "Publié", "Archivé"],
        message: "Le statut '{VALUE}' n'est pas valide pour un chapitre",
      },
      default: "Brouillon",
    },
    /**
     * @deprecated LEGACY — plage de numéros (ex. [1,2,...,24]), PAS des entités Page.
     * Ne plus utiliser pour la gestion des pages éditoriales.
     * Source de vérité : collection Page (Page.chapitre + Page.ordre).
     * Conservé temporairement pour compatibilité ; ne pas ajouter de logique métier.
     */
    pages: {
      type: [Number],
      default: [],
    },
    gratuit: {
      type: Boolean,
      default: false,
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
  }
);

chapitreSchema.index({ livre: 1, ordre: 1 });
chapitreSchema.index({ livre: 1, slug: 1 });
chapitreSchema.index({ livre: 1, statut: 1 });

chapitreSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("titre")) {
    this.slug = slugify(this.titre);
  }

  if (this.isModified("contenu")) {
    const texte = extraireTexteTiptap(this.contenu);
    const mots = texte.trim().split(/\s+/).filter(Boolean).length;
    this.motsCount = mots;
    const minutes = Math.max(1, Math.round(mots / 200));
    this.tempsLecture = `${minutes} min`;
  }

  next();
});

export const Chapitre = mongoose.model("Chapitre", chapitreSchema);
