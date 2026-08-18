import mongoose from "mongoose";

const abonneSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'adresse e-mail est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    nom: {
      type: String,
      trim: true,
      default: "",
    },
    statut: {
      type: String,
      enum: ["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "BLOCKED"],
      default: "ACTIVE",
      index: true,
    },
    source: {
      type: String,
      enum: ["Site web", "Achat de livre", "Import", "Ajout manuel", "Premium"],
      default: "Site web",
    },
    interet: {
      type: String,
      enum: ["Média", "Édition", "Tous"],
      default: "Média",
    },
    achats: {
      type: Number,
      default: 0,
    },
    premium: {
      type: Boolean,
      default: false,
    },
    interaction: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "inscription", updatedAt: "updatedAt" },
    toJSON: { virtuals: true },
  }
);

export const AbonneNewsletter = mongoose.model("AbonneNewsletter", abonneSchema);
