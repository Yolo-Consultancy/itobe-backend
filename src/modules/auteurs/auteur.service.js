import { Auteur } from "./auteur.model.js";
import { Livre } from "../livres/livre.model.js";
import { Article } from "../articles/article.model.js";
import { AppError } from "../../utils/api-error.js";
import { slugify } from "../../utils/slugify.js";
import { resolveCloudinaryMediaFields } from "../../utils/cloudinary.service.js";

export class AuteurService {
  static async getAllAuteurs({ page, limit, q } = {}) {
    const filter = {};
    if (q) {
      filter.$or = [
        { nom: { $regex: q, $options: "i" } },
        { ville: { $regex: q, $options: "i" } },
        { role: { $regex: q, $options: "i" } },
      ];
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [auteurs, total] = await Promise.all([
        Auteur.find(filter).sort({ nom: 1 }).skip(skip).limit(Number(limit)),
        Auteur.countDocuments(filter),
      ]);
      return {
        auteurs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    const auteurs = await Auteur.find(filter).sort({ nom: 1 });
    return { auteurs };
  }

  static async getAuteurBySlug(slugOrId) {
    let auteur = await Auteur.findOne({ slug: slugOrId });
    if (!auteur && slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      auteur = await Auteur.findById(slugOrId);
    }

    if (!auteur) {
      throw new AppError("Auteur introuvable", 404);
    }

    // Récupérer les livres et articles de l'auteur
    const [livres, articles] = await Promise.all([
      Livre.find({ auteur: auteur._id, disponible: true }).sort({ publication: -1 }),
      Article.find({ auteur: auteur._id, statut: "Publié" }).sort({ datePublication: -1 }),
    ]);

    return {
      auteur,
      livres,
      articles,
    };
  }

  static async createAuteur(data) {
    const slug = slugify(data.nom);
    const existing = await Auteur.findOne({ slug });
    if (existing) {
      throw new AppError(`Un auteur avec le nom '${data.nom}' existe déjà`, 409);
    }

    const payload = await resolveCloudinaryMediaFields(data, {
      folder: "itobe/auteurs",
      coverKey: "photo",
      galleryKey: null,
    });

    const auteur = await Auteur.create({
      ...payload,
      slug,
    });

    return auteur;
  }

  static async updateAuteur(id, updateData) {
    if (updateData.nom) {
      updateData.slug = slugify(updateData.nom);
    }

    const payload = await resolveCloudinaryMediaFields(updateData, {
      folder: "itobe/auteurs",
      coverKey: "photo",
      galleryKey: null,
    });

    const auteur = await Auteur.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!auteur) {
      throw new AppError("Auteur introuvable", 404);
    }

    return auteur;
  }

  static async deleteAuteur(id) {
    const auteur = await Auteur.findByIdAndDelete(id);
    if (!auteur) {
      throw new AppError("Auteur introuvable", 404);
    }
    return auteur;
  }

  static async getAuteurByUserId(userId) {
    const auteur = await Auteur.findOne({ user: userId });
    if (!auteur) {
      throw new AppError("Aucune fiche auteur n'est liée à ce compte.", 404);
    }
    return auteur;
  }

  static async updateBioByUserId(userId, bio) {
    const auteur = await Auteur.findOne({ user: userId });
    if (!auteur) {
      throw new AppError("Aucune fiche auteur n'est liée à ce compte.", 404);
    }
    auteur.bio = String(bio ?? "").trim();
    await auteur.save();
    return auteur;
  }
}
