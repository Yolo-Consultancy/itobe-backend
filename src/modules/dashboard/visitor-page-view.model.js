import mongoose from "mongoose";

const visitorPageViewSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, trim: true, maxlength: 120 },
    path: { type: String, required: true, trim: true, maxlength: 500 },
    date: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

visitorPageViewSchema.index({ createdAt: 1 });
visitorPageViewSchema.index({ path: 1, createdAt: 1 });

export const VisitorPageView = mongoose.model("VisitorPageView", visitorPageViewSchema);
