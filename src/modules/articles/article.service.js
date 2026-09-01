import { Article } from "./article.model.js";
import { Auteur } from "../auteurs/auteur.model.js";
import { Category } from "../categories/category.model.js";
import { AppError } from "../../utils/api-error.js";
import { slugify } from "../../utils/slugify.js";
import { resolveCloudinaryMediaFields } from "../../utils/cloudinary.service.js";

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
    let auteurId = data.auteur;
    if (typeof auteurId === "string" && !auteurId.match(/^[0-9a-fA-F]{24}$/)) {
      const auteur = await Auteur.findOne({ slug: auteurId });
      if (!auteur) throw new AppError(`Auteur '${data.auteur}' introuvable`, 404);
      auteurId = auteur._id;
    }

    // Résolution de la catégorie
    let categorieId = data.categorie;
    if (typeof categorieId === "string" && !categorieId.match(/^[0-9a-fA-F]{24}$/)) {
      let cat = await Category.findOne({
        $or: [{ slug: slugify(categorieId) }, { nom: categorieId }],
        type: "media",
      });
      if (!cat) {
        cat = await Category.create({ nom: categorieId, type: "media" });
      }
      categorieId = cat._id;
    }

    const payload = await resolveCloudinaryMediaFields(data, { folder: "itobe/articles" });

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

    if (data.auteur && typeof data.auteur === "string" && !data.auteur.match(/^[0-9a-fA-F]{24}$/)) {
      const auteur = await Auteur.findOne({ slug: data.auteur });
      if (auteur) data.auteur = auteur._id;
    }

    if (data.categorie && typeof data.categorie === "string" && !data.categorie.match(/^[0-9a-fA-F]{24}$/)) {
      const cat = await Category.findOne({
        $or: [{ slug: slugify(data.categorie) }, { nom: data.categorie }],
        type: "media",
      });
      if (cat) data.categorie = cat._id;
    }

    const payload = await resolveCloudinaryMediaFields(data, { folder: "itobe/articles" });

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
