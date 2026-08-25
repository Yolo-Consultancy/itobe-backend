import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const connexionSchema = new mongoose.Schema(
  {
    appareil: { type: String, default: "Inconnu" },
    navigateur: { type: String, default: "Inconnu" },
    lieu: { type: String, default: "Kinshasa, RDC" },
    ip: { type: String, default: "127.0.0.1" },
    date: { type: String },
    statut: { type: String, enum: ["Réussie", "Échouée"], default: "Réussie" },
    actuelle: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },
    prenom: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, "L'adresse e-mail est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Adresse e-mail invalide"],
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "editeur", "lecteur"],
        message: "Le rôle '{VALUE}' n'est pas valide",
      },
      default: "lecteur",
    },
    statut: {
      type: String,
      enum: ["Actif", "Suspendu"],
      default: "Actif",
    },
    telephone: {
      type: String,
      trim: true,
      default: "",
    },
    adresse: {
      type: String,
      trim: true,
      default: "",
    },
    ville: {
      type: String,
      trim: true,
      default: "Kinshasa",
    },
    avatar: {
      type: String,
      default: "",
    },
    preferences: {
      newsletter: { type: Boolean, default: true },
      nouveautes: { type: Boolean, default: true },
      resume: { type: Boolean, default: false },
      themeLecture: { type: String, enum: ["clair", "sombre", "auto"], default: "clair" },
      taillePolice: { type: Number, default: 18 },
    },
    deuxFacteurs: {
      actif: { type: Boolean, default: false },
      secret: { type: String, select: false },
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    historiqueConnexions: [connexionSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash du mot de passe avant sauvegarde
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Méthode de comparaison du mot de passe
userSchema.methods.comparerMotDePasse = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const User = mongoose.model("User", userSchema);
