import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["Image", "Audio", "Document"],
      default: "Image",
      index: true,
    },
    poids: {
      type: String,
      default: "0 Ko",
    },
    tailleOctets: {
      type: Number,
      default: 0,
    },
    mimetype: {
      type: String,
      default: "",
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const Media = mongoose.model("Media", mediaSchema);
