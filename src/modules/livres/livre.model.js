import mongoose from "mongoose";
import { slugify } from "../../utils/slugify.js";

const chapitreSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    pages: { type: [Number], default: [] },
    gratuit: { type: Boolean, default: false },
  },
  { _id: false }
);

const livreSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Le titre du livre est obligatoire"],
      trim: true,
    },
    sousTitre: {
      type: String,
      trim: true,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auteur",
      required: [true, "L'auteur est obligatoire"],
    },
    isbn: {
      type: String,
      trim: true,
      default: "",
    },
    resume: {
      type: String,
      required: [true, "Le résumé est obligatoire"],
    },
    pages: {
      type: Number,
      required: [true, "Le nombre de pages est obligatoire"],
      min: 1,
    },
    langue: {
      type: String,
      default: "Français",
    },
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "La catégorie est obligatoire"],
    },
    publication: {
      type: Date,
      default: Date.now,
    },
    formats: {
      type: [String],
      enum: ["PDF", "EPUB", "Papier"],
      default: ["PDF", "EPUB"],
    },
    prix: {
      type: Number,
      required: [true, "Le prix est obligatoire"],
      min: 0,
    },
    promo: {
      type: Number,
      default: null,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    aLaUne: {
      type: Boolean,
      default: false,
    },
    couleur: {
      type: String,
      default: "linear-gradient(160deg, oklch(0.62 0.15 48), oklch(0.3 0.05 40))",
    },
    couverture: {
      type: String,
      default: "",
    },
    apercuPages: {
      type: Number,
      default: 10,
    },
    apercuPourcent: {
      type: Number,
      default: 10,
    },
    chapitres: {
      type: [chapitreSchema],
      default: [],
    },
    fichiers: {
      pdfUrl: { type: String, default: "" },
      epubUrl: { type: String, default: "" },
    },
    ventesCount: {
      type: Number,
      default: 0,
    },
    lecturesCount: {
      type: Number,
      default: 0,
    },
    telechargementsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

livreSchema.index({ categorie: 1 });
livreSchema.index({ auteur: 1 });
livreSchema.index({ disponible: 1, publication: -1 });

livreSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("titre")) {
    this.slug = slugify(this.titre);
  }
  next();
});

export const Livre = mongoose.model("Livre", livreSchema);
