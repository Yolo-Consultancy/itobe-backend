import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la promotion est obligatoire"],
      trim: true,
    },
    cible: {
      type: String,
      required: [true, "La cible de la promotion (catégorie) est obligatoire"],
      trim: true,
    },
    remise: {
      type: Number,
      required: [true, "Le pourcentage de remise est obligatoire"],
      min: 0,
      max: 100,
    },
    debut: {
      type: Date,
      required: [true, "La date de début est obligatoire"],
    },
    fin: {
      type: Date,
      required: [true, "La date de fin est obligatoire"],
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const Promotion = mongoose.model("Promotion", promotionSchema);
