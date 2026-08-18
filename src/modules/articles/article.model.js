import mongoose from "mongoose";
import { slugify } from "../../utils/slugify.js";

const articleSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Le titre de l'article est obligatoire"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    chapo: {
      type: String,
      required: [true, "Le résumé (chapô) est obligatoire"],
      trim: true,
    },
    contenu: {
      type: String,
      default: "",
    },
    corps: {
      type: [String],
      default: [],
    },
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auteur",
      required: [true, "L'auteur est obligatoire"],
    },
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "La catégorie est obligatoire"],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    youtube: {
      type: String,
      default: "",
    },
    couverture: {
      type: String,
      default: "",
    },
    galerie: {
      type: [String],
      default: [],
    },
    statut: {
      type: String,
      enum: ["Brouillon", "Programmé", "Publié"],
      default: "Brouillon",
    },
    etat: {
      type: String,
      enum: ["Brouillon", "En revue", "Publié", "Rejeté"],
      default: "Brouillon",
    },
    aLaUne: {
      type: Boolean,
      default: false,
    },
    populaire: {
      type: Boolean,
      default: false,
    },
    datePublication: {
      type: Date,
      default: Date.now,
    },
    lecture: {
      type: String,
      default: "5 min",
    },
    vues: {
      type: Number,
      default: 0,
    },
    commentairesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

articleSchema.index({ statut: 1, datePublication: -1 });
articleSchema.index({ categorie: 1 });
articleSchema.index({ auteur: 1 });

articleSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("titre")) {
    this.slug = slugify(this.titre);
  }
  // Calcul automatique du temps de lecture si corps / contenu présent
  if (this.isModified("contenu") || this.isModified("corps")) {
    const text = this.contenu || (this.corps || []).join(" ");
    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    this.lecture = `${minutes} min`;
  }
  next();
});

export const Article = mongoose.model("Article", articleSchema);
