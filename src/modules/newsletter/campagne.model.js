import mongoose from "mongoose";

const campagneSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la campagne est obligatoire"],
      trim: true,
    },
    sujet: {
      type: String,
      required: [true, "Le sujet de l'e-mail est obligatoire"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["marketing", "notification", "recurrent"],
      default: "marketing",
    },
    expediteur: {
      type: String,
      default: "La rédaction Itobe",
    },
    emailExpediteur: {
      type: String,
      default: "hello@itobe.cd",
    },
    repondreA: {
      type: String,
      default: "contact@itobe.cd",
    },
    audience: {
      type: String,
      enum: ["tous", "nouveaux", "media", "acheteurs", "reguliers", "premium"],
      default: "tous",
    },
    template: {
      type: String,
      default: "",
    },
    statut: {
      type: String,
      enum: ["DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED", "FAILED"],
      default: "DRAFT",
      index: true,
    },
    envoiPrevu: {
      type: Date,
      default: null,
    },
    envoyee: {
      type: Date,
      default: null,
    },
    destinataires: { type: Number, default: 0 },
    envoyes: { type: Number, default: 0 },
    delivres: { type: Number, default: 0 },
    ouvertures: { type: Number, default: 0 },
    clics: { type: Number, default: 0 },
    desabonnements: { type: Number, default: 0 },
    blocs: {
      type: [Object],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "creee", updatedAt: "updatedAt" },
    toJSON: { virtuals: true },
  }
);

export const CampagneNewsletter = mongoose.model("CampagneNewsletter", campagneSchema);
