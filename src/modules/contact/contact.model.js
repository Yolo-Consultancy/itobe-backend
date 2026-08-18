import mongoose from "mongoose";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => emailRegex.test(v),
        message: (props) => `${props.value} n'est pas un email valide`,
      },
    },
    subject: {
      type: String,
      required: [true, "Le sujet est obligatoire"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Le message est obligatoire"],
      trim: true,
    },
  },
  { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
