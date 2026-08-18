import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom du template est obligatoire"],
      trim: true,
    },
    sujet: {
      type: String,
      required: [true, "Le sujet par défaut est obligatoire"],
      trim: true,
    },
    categorie: {
      type: String,
      enum: ["Média", "Édition", "Commercial", "Récurrent", "Notification", "Onboarding"],
      default: "Média",
    },
    usage: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    blocs: {
      type: [Object],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const TemplateNewsletter = mongoose.model("TemplateNewsletter", templateSchema);
