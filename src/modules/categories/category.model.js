import mongoose from "mongoose";
import { slugify } from "../../utils/slugify.js";

const categorySchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la catégorie est obligatoire"],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ["media", "livre"],
        message: "Le type doit être 'media' ou 'livre'",
      },
      required: [true, "Le type de catégorie est obligatoire (media ou livre)"],
    },
    visibilite: {
      type: String,
      enum: ["Publique", "Privée"],
      default: "Publique",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Index composé unique sur nom + type et slug + type
categorySchema.index({ nom: 1, type: 1 }, { unique: true });
categorySchema.index({ slug: 1, type: 1 }, { unique: true });

categorySchema.pre("save", function (next) {
  if (!this.slug || this.isModified("nom")) {
    this.slug = slugify(this.nom);
  }
  next();
});

export const Category = mongoose.model("Category", categorySchema);
