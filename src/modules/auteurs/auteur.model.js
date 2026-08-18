import mongoose from "mongoose";
import { slugify } from "../../utils/slugify.js";

const auteurSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de l'auteur est obligatoire"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
      default: "Auteur & essayiste",
    },
    bio: {
      type: String,
      default: "",
    },
    ville: {
      type: String,
      trim: true,
      default: "Kinshasa",
    },
    photo: {
      type: String,
      default: "",
    },
    reseaux: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    ventes: {
      type: Number,
      default: 0,
      min: 0,
    },
    lectures: {
      type: Number,
      default: 0,
      min: 0,
    },
    telechargements: {
      type: Number,
      default: 0,
      min: 0,
    },
    user: {
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

auteurSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("nom")) {
    this.slug = slugify(this.nom);
  }
  next();
});

export const Auteur = mongoose.model("Auteur", auteurSchema);
