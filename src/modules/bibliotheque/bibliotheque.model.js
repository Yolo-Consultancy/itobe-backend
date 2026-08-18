import mongoose from "mongoose";

const progressionSchema = new mongoose.Schema(
  {
    livre: { type: mongoose.Schema.Types.ObjectId, ref: "Livre", required: true },
    page: { type: Number, default: 1 },
    pourcentage: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const marquePageSchema = new mongoose.Schema(
  {
    livre: { type: mongoose.Schema.Types.ObjectId, ref: "Livre", required: true },
    page: { type: Number, required: true },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: true }
);

const appareilSchema = new mongoose.Schema(
  {
    idAppareil: { type: String, required: true },
    nom: { type: String, default: "Mon Appareil" },
    typeAppareil: { type: String, enum: ["Mobile", "Tablette", "Ordinateur"], default: "Mobile" },
    derniereSync: { type: Date, default: Date.now },
    page: { type: Number, default: 1 },
    actuel: { type: Boolean, default: false },
  },
  { _id: true }
);

const bibliothequeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    achetes: [
      {
        livre: { type: mongoose.Schema.Types.ObjectId, ref: "Livre", required: true },
        dateAchat: { type: Date, default: Date.now },
      },
    ],
    favoris: [{ type: mongoose.Schema.Types.ObjectId, ref: "Livre" }],
    telecharges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Livre" }],
    progressions: [progressionSchema],
    marquePages: [marquePageSchema],
    appareils: [appareilSchema],
    historiqueSync: [
      {
        date: { type: Date, default: Date.now },
        action: String,
        details: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const Bibliotheque = mongoose.model("Bibliotheque", bibliothequeSchema);
