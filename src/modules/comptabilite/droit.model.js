import mongoose from "mongoose";

const droitSchema = new mongoose.Schema(
  {
    espace: { type: String, required: true },
    module: { type: String, required: true },
    action: { type: String, required: true, enum: ["creer", "lire", "modifier", "supprimer"] },
    role: { type: String, required: true, enum: ["editeur", "comptable", "lecteur"] },
    autorise: { type: Boolean, required: true },
  },
  { timestamps: true },
);

droitSchema.index({ espace: 1, module: 1, action: 1, role: 1 }, { unique: true });

export const Droit = mongoose.model("Droit", droitSchema);
