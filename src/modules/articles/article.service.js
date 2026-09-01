import { Article } from "./article.model.js";
import { Auteur } from "../auteurs/auteur.model.js";
import { Category } from "../categories/category.model.js";
import { AppError } from "../../utils/api-error.js";
import { slugify } from "../../utils/slugify.js";
import { resolveCloudinaryMediaFields } from "../../utils/cloudinary.service.js";

async function resolveAuteurId(value) {
  if (!value) return value;

  if (value && typeof value === "object") {
    if (typeof value.slug === "string") {
      const auteur = await Auteur.findOne({ slug: value.slug });
      if (auteur) return auteur._id;
    }
    if (typeof value._id === "string" && value._id.match(/^[0-9a-fA-F]{24}$/)) {
      return value._id;
    }
    throw new AppError("Auteur invalide", 400);
  }

  if (typeof value === "string" && value.match(/^[0-9a-fA-F]{24}$/)) {
    return value;
  }

  if (typeof value === "string") {
    const auteur = await Auteur.findOne({ slug: value });
    if (!auteur) {
      throw new AppError(`Auteur '${value}' introuvable`, 404);
    }
    return auteur._id;
  }

  throw new AppError("Auteur invalide", 400);
}

async function resolveCategorieMediaId(value) {
  if (!value) return value;

  if (value && typeof value === "object") {
    const label = typeof value.nom === "string" ? value.nom : typeof value.slug === "string" ? value.slug : null;
    if (label) {
      let cat = await Category.findOne({
        $or: [{ slug: slugify(label) }, { nom: label }],
        type: "media",
      });
      if (!cat) {
        cat = await Category.create({ nom: label, type: "media" });
      }
      return cat._id;
    }
    if (typeof value._id === "string" && value._id.match(/^[0-9a-fA-F]{24}$/)) {
      return value._id;
    }
    throw new AppError("Catégorie invalide", 400);
  }

  if (typeof value === "string") {
    let cat = await Category.findOne({
      $or: [{ slug: slugify(value) }, { nom: value }],
      type: "media",
    });
    if (!cat) {
      cat = await Category.create({ nom: value, type: "media" });
    }
    return cat._id;
  }

  throw new AppError("Catégorie invalide", 400);
}

export class ArticleService {
  static async getAllArticles({ page = 1, limit = 10, categorie, tag, populaire, q, admin = false } = {}) {
    const filter = {};

    if (!admin) {
      filter.statut = "Publié";
      filter.datePublication = { $lte: new Date() };
    }

    if (categorie) {
      const cat = await Category.findOne({ slug: categorie, type: "media" });
      if (cat) filter.categorie = cat._id;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (populaire === "true" || populaire === true) {
      filter.$or = [{ populaire: true }, { aLaUne: true }];
    }

    if (q) {
      filter.$or = [
        { titre: { $regex: q, $options: "i" } },
        { chapo: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    const skip = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      Article.find(filter)
        .populate("auteur", "nom slug role photo")
        .populate("categorie", "nom slug")
        .sort({ datePublication: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Article.countDocuments(filter),
    ]);

    return {
      articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getArticleBySlug(slugOrId, incrementViews = false) {
    let article = await Article.findOne({ slug: slugOrId })
      .populate("auteur", "nom slug role bio photo reseaux")
      .populate("categorie", "nom slug");

    if (!article && slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      article = await Article.findById(slugOrId)
        .populate("auteur", "nom slug role bio photo reseaux")
        .populate("categorie", "nom slug");
    }

    if (!article) {
      throw new AppError("Article introuvable", 404);
    }

    if (incrementViews) {
      article.vues += 1;
      await article.save({ validateBeforeSave: false });
    }

    // Récupérer 3 articles suggérés ("À lire aussi")
    const suite = await Article.find({
      _id: { $ne: article._id },
      statut: "Publié",
    })
      .populate("auteur", "nom slug")
      .populate("categorie", "nom slug")
      .sort({ datePublication: -1 })
      .limit(3);

    return {
      article,
      suite,
    };
  }

  static async createArticle(data) {
    const slug = slugify(data.titre);
    const existing = await Article.findOne({ slug });
    if (existing) {
      throw new AppError(`Un article avec le titre '${data.titre}' existe déjà`, 409);
    }

    // Résolution de l'auteur
    const auteurId = await resolveAuteurId(data.auteur);

    // Résolution de la catégorie
    const categorieId = await resolveCategorieMediaId(data.categorie);

    const payload = await resolveCloudinaryMediaFields(data, {
      folder: "itobe/articles",
      htmlKeys: ["contenu"],
    });

    const article = await Article.create({
      ...payload,
      slug,
      auteur: auteurId,
      categorie: categorieId,
      statut: payload.statut || "Brouillon",
      etat:
        payload.statut === "Publié"
          ? "Publié"
          : payload.statut === "Programmé"
            ? "En revue"
            : "Brouillon",
      datePublication:
        payload.datePublication ||
        (payload.statut === "Publié" ? new Date() : undefined),
    });

    return await article.populate(["auteur", "categorie"]);
  }

  static async updateArticle(id, data) {
    if (data.titre) {
      data.slug = slugify(data.titre);
    }

    if (data.statut) {
      data.etat =
        data.statut === "Publié" ? "Publié" : data.statut === "Programmé" ? "En revue" : "Brouillon";
      if (data.statut === "Publié" && !data.datePublication) {
        data.datePublication = new Date();
      }
    }

    if (data.etat === "Publié" && !data.statut) {
      data.statut = "Publié";
      if (!data.datePublication) {
        data.datePublication = new Date();
      }
    }

    if (data.auteur !== undefined) {
      data.auteur = await resolveAuteurId(data.auteur);
    }

    if (data.categorie !== undefined) {
      data.categorie = await resolveCategorieMediaId(data.categorie);
    }

    const payload = await resolveCloudinaryMediaFields(data, {
      folder: "itobe/articles",
      htmlKeys: ["contenu"],
    });

    const article = await Article.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate(["auteur", "categorie"]);

    if (!article) {
      throw new AppError("Article introuvable", 404);
    }

    return article;
  }

  static async deleteArticle(id) {
    const article = await Article.findByIdAndDelete(id);
    if (!article) {
      throw new AppError("Article introuvable", 404);
    }
    return article;
  }
}
