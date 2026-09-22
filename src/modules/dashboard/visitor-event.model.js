import mongoose from "mongoose";

const visitorEventSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

visitorEventSchema.index({ visitorId: 1, date: 1 }, { unique: true });
visitorEventSchema.index({ date: 1 });

export const VisitorEvent = mongoose.model("VisitorEvent", visitorEventSchema);
