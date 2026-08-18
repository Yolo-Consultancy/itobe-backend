import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Le code coupon est obligatoire"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["Pourcentage", "Montant"],
      default: "Pourcentage",
    },
    remise: {
      type: Number,
      required: [true, "La remise est obligatoire"],
      min: 0,
    },
    utilisations: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUtilisations: {
      type: Number,
      default: null,
    },
    expiration: {
      type: Date,
      default: null,
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

export const Coupon = mongoose.model("Coupon", couponSchema);
