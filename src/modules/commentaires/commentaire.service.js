import { Commentaire } from "./commentaire.model.js";
import { Article } from "../articles/article.model.js";
import { AppError } from "../../utils/api-error.js";

export class CommentaireService {
  static async getCommentairesByCible(cible, cibleId, { statut = "Publié" } = {}) {
    const filter = { cible, cibleId, statut };
    const commentaires = await Commentaire.find(filter).sort({ createdAt: -1 });
    return commentaires;
  }

  static async getAllCommentaires({ page = 1, limit = 20, statut, cible, q } = {}) {
    const filter = {};
    if (statut && statut !== "Tous") filter.statut = statut;
    if (cible && cible !== "Tous") filter.cible = cible;
    if (q) {
      filter.$or = [
        { auteurNom: { $regex: q, $options: "i" } },
        { contenu: { $regex: q, $options: "i" } },
        { auteurEmail: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [commentaires, total] = await Promise.all([
      Commentaire.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Commentaire.countDocuments(filter),
    ]);

    return {
      commentaires,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async createCommentaire({ cible, cibleId, auteurNom, auteurEmail, contenu, note, userId, ip }) {
    // Détermination du cibleModel
    const cibleModel = cible === "article" ? "Article" : "Livre";

    const commentaire = await Commentaire.create({
      cible,
      cibleId,
      cibleModel,
      auteurNom: auteurNom.trim(),
      auteurEmail: (auteurEmail || "").toLowerCase().trim(),
      contenu: contenu.trim(),
      note: note ? Number(note) : null,
      user: userId || null,
      ip: ip || "",
      statut: "En attente",
    });

    return commentaire;
  }

  static async modererCommentaire(id, statut) {
    const commentaire = await Commentaire.findById(id);
    if (!commentaire) {
      throw new AppError("Commentaire introuvable", 404);
    }

    const ancienStatut = commentaire.statut;
    commentaire.statut = statut;
    await commentaire.save();

    // Mise à jour du compteur dans l'article
    if (commentaire.cible === "article") {
      const delta =
        statut === "Publié" && ancienStatut !== "Publié" ? 1 :
        statut !== "Publié" && ancienStatut === "Publié" ? -1 : 0;

      if (delta !== 0) {
        await Article.findByIdAndUpdate(commentaire.cibleId, {
          $inc: { commentairesCount: delta },
        });
      }
    }

    return commentaire;
  }

  static async deleteCommentaire(id) {
    const commentaire = await Commentaire.findByIdAndDelete(id);
    if (!commentaire) {
      throw new AppError("Commentaire introuvable", 404);
    }

    if (commentaire.cible === "article" && commentaire.statut === "Publié") {
      await Article.findByIdAndUpdate(commentaire.cibleId, {
        $inc: { commentairesCount: -1 },
      });
    }

    return commentaire;
  }
}
