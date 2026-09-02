import jwt from "jsonwebtoken";
import crypto from "crypto";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { User } from "../users/user.model.js";
import { AppError } from "../../utils/api-error.js";
import { ENV } from "../../config/env.config.js";
import { isEmailConfigured, sendPasswordResetEmail } from "../../utils/email.service.js";
import {
  assertCloudinaryConfigured,
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../../utils/cloudinary.service.js";

export class AuthService {
  static genererTokens(userId, role) {
    const accessToken = jwt.sign({ id: userId, role }, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign({ id: userId, role }, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
    });
    return { accessToken, refreshToken };
  }

  static async register({ nom, prenom, email, password, telephone, adresse }) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw new AppError("Un compte avec cette adresse e-mail existe déjà.", 409);
    }

    const user = await User.create({
      nom: nom.trim(),
      prenom: (prenom || "").trim(),
      email: email.toLowerCase().trim(),
      password,
      telephone: (telephone || "").trim(),
      adresse: (adresse || "").trim(),
      role: "lecteur", // Rôle par défaut à l'inscription
    });

    const tokens = this.genererTokens(user._id, user.role);

    return {
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  static async login({ email, password, metaConnexion = {} }) {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password +deuxFacteurs.secret");
    if (!user) {
      throw new AppError("Adresse e-mail ou mot de passe incorrect.", 401);
    }

    if (user.statut === "Suspendu") {
      throw new AppError("Votre compte est actuellement suspendu. Veuillez contacter le support.", 403);
    }

    const mdpValide = await user.comparerMotDePasse(password, user.password);
    if (!mdpValide) {
      // Enregistrer la tentative échouée
      user.historiqueConnexions.unshift({
        appareil: metaConnexion.appareil || "Navigateur Web",
        navigateur: metaConnexion.navigateur || "Inconnu",
        lieu: metaConnexion.lieu || "Kinshasa, RDC",
        ip: metaConnexion.ip || "127.0.0.1",
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
        statut: "Échouée",
      });
      if (user.historiqueConnexions.length > 20) user.historiqueConnexions.pop();
      await user.save({ validateBeforeSave: false });

      throw new AppError("Adresse e-mail ou mot de passe incorrect.", 401);
    }

    // Enregistrer la connexion réussie
    user.historiqueConnexions.unshift({
      appareil: metaConnexion.appareil || "Navigateur Web",
      navigateur: metaConnexion.navigateur || "Inconnu",
      lieu: metaConnexion.lieu || "Kinshasa, RDC",
      ip: metaConnexion.ip || "127.0.0.1",
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      statut: "Réussie",
      actuelle: true,
    });
    if (user.historiqueConnexions.length > 20) user.historiqueConnexions.pop();
    await user.save({ validateBeforeSave: false });

    const tokens = this.genererTokens(user._id, user.role);

    return {
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
        deuxFacteursActif: user.deuxFacteurs?.actif || false,
      },
      ...tokens,
    };
  }

  static async refreshToken(token) {
    if (!token) {
      throw new AppError("Token de rafraîchissement manquant.", 400);
    }

    const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.statut === "Suspendu") {
      throw new AppError("Session invalide.", 401);
    }

    const tokens = this.genererTokens(user._id, user.role);
    return tokens;
  }

  static async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404);
    }
    return user;
  }

  static async updateProfile(userId, updateData) {
    const champsAutorises = ["nom", "prenom", "telephone", "adresse", "ville", "avatar", "preferences"];
    const filtered = {};

    for (const key of champsAutorises) {
      if (updateData[key] !== undefined) {
        filtered[key] = updateData[key];
      }
    }

    if (updateData.email) {
      const email = updateData.email.toLowerCase().trim();
      const existing = await User.findOne({ email, _id: { $ne: userId } });
      if (existing) {
        throw new AppError("Cette adresse e-mail est déjà utilisée par un autre compte.", 409);
      }
      filtered.email = email;
    }

    const user = await User.findByIdAndUpdate(userId, filtered, {
      new: true,
      runValidators: true,
    });

    return user;
  }

  static async updateAvatar(userId, file) {
    if (!file) {
      throw new AppError("Aucune photo fournie.", 400);
    }
    if (!file.mimetype?.startsWith("image/")) {
      throw new AppError("La photo doit être une image.", 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError("La photo ne doit pas dépasser 5 Mo.", 400);
    }

    assertCloudinaryConfigured();
    const uploaded = await uploadBufferToCloudinary(file.buffer, {
      folder: "itobe/profils",
      mimetype: file.mimetype,
    });
    const user = await User.findById(userId).select("+avatarPublicId");
    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404);
    }

    const previousPublicId = user.avatarPublicId;
    user.avatar = uploaded.url;
    user.avatarPublicId = uploaded.publicId;
    await user.save({ validateBeforeSave: false });
    if (previousPublicId) await deleteFromCloudinary(previousPublicId);

    return user;
  }

  static async changePassword(userId, body) {
    const mdpActuel = body.mdpActuel ?? body.ancienPassword;
    const mdpNouveau = body.mdpNouveau ?? body.nouveauPassword;

    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404);
    }

    const valide = await user.comparerMotDePasse(mdpActuel, user.password);
    if (!valide) {
      throw new AppError("Le mot de passe actuel est incorrect.", 400);
    }

    if (!mdpNouveau || mdpNouveau.length < 6) {
      throw new AppError("Le nouveau mot de passe doit comporter au moins 6 caractères.", 400);
    }

    user.password = mdpNouveau;
    await user.save();

    return { message: "Mot de passe mis à jour avec succès." };
  }

  static async requestPasswordReset(email) {
    const message =
      "Si un compte existe avec cette adresse e-mail, un lien de réinitialisation vous a été envoyé.";

    if (!email?.trim()) {
      throw new AppError("L'adresse e-mail est obligatoire.", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.statut === "Suspendu") {
      return { message };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${ENV.CLIENT_URL}/reinitialiser-mot-de-passe?token=${resetToken}`;
    const result = { message, emailSent: false };

    if (isEmailConfigured()) {
      try {
        await sendPasswordResetEmail({
          to: user.email,
          prenom: user.prenom || user.nom,
          resetUrl,
        });
        result.emailSent = true;
        console.log(`[EMAIL] Réinitialisation envoyée à ${user.email}`);
      } catch (error) {
        console.error("[EMAIL] Échec envoi réinitialisation mot de passe:", error.message);
        if (ENV.NODE_ENV === "development") {
          console.log(`[RESET PASSWORD] Lien de secours pour ${user.email}: ${resetUrl}`);
          result.resetUrl = resetUrl;
          result.emailError = error.message;
        }
      }
    } else if (ENV.NODE_ENV === "development") {
      console.log(`[RESET PASSWORD] SMTP non configuré — lien pour ${user.email}: ${resetUrl}`);
      result.resetUrl = resetUrl;
    }

    return result;
  }

  static async resetPassword({ token, password }) {
    let rawToken = (token || "").trim();
    try {
      rawToken = decodeURIComponent(rawToken).trim();
    } catch {
      // token déjà décodé
    }

    if (!rawToken) {
      throw new AppError("Lien de réinitialisation invalide.", 400);
    }

    if (!password || password.length < 6) {
      throw new AppError("Le mot de passe doit comporter au moins 6 caractères.", 400);
    }

    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      throw new AppError(
        "Lien de réinitialisation invalide ou expiré. Demandez un nouveau lien (seul le dernier e-mail reçu est valide).",
        400,
      );
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: "Mot de passe réinitialisé avec succès." };
  }

  static async setup2FA(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404);
    }

    const secret = speakeasy.generateSecret({
      name: `Itobe Entreprise (${user.email})`,
      length: 20,
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    user.deuxFacteurs = {
      actif: false,
      secret: secret.base32,
    };
    await user.save({ validateBeforeSave: false });

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
    };
  }

  static async verify2FA(userId, code) {
    const user = await User.findById(userId).select("+deuxFacteurs.secret");
    if (!user || !user.deuxFacteurs?.secret) {
      throw new AppError("Configuration 2FA non initiée.", 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.deuxFacteurs.secret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new AppError("Code de vérification invalide ou expiré.", 400);
    }

    user.deuxFacteurs.actif = true;
    await user.save({ validateBeforeSave: false });

    return { message: "Double authentification activée avec succès." };
  }

  static async deleteMyAccount(userId) {
    await User.findByIdAndDelete(userId);
    return { message: "Compte supprimé avec succès." };
  }
}
