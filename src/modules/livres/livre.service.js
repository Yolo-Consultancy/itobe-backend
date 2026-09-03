import { Livre } from "./livre.model.js";
import { Auteur } from "../auteurs/auteur.model.js";
import { Category } from "../categories/category.model.js";
import { AppError } from "../../utils/api-error.js";
import { slugify } from "../../utils/slugify.js";
import {
  assertCloudinaryConfigured,
  uploadBufferToCloudinary,
  resolveCloudinaryMediaFields,
} from "../../utils/cloudinary.service.js";
import { uploadFileToGridFS, deleteFileFromGridFS } from "../../utils/gridfs.service.js";
import { extractAndPopulatePdfChapters } from "../../utils/pdf-extractor.js";

export class LivreService {
  static masquerFichiers(livre) {
    const resultat = livre?.toObject ? livre.toObject() : { ...livre };
    if (resultat) delete resultat.fichiers;
    return resultat;
  }

  static async uploadFichier(id, file, format) {
    if (!file) throw new AppError("Aucun fichier fourni", 400);
    const extension = format === "pdf" ? "pdf" : format === "epub" ? "epub" : "";
    if (!extension) throw new AppError("Format de fichier invalide", 400);
    if (file.size > 50 * 1024 * 1024) {
      throw new AppError("Le fichier ne doit pas dépasser 50 Mo", 400);
    }
    const mimeAttendu = extension === "pdf" ? "application/pdf" : "application/epub+zip";
    if (file.mimetype !== mimeAttendu) {
      throw new AppError(`Le fichier doit être au format ${extension.toUpperCase()}`, 400);
    }

    const livre = await Livre.findById(id).select("+fichiers");
    if (!livre) throw new AppError("Livre introuvable", 404);

    const ancienFileId = livre.fichiers?.[`${extension}FileId`];
    if (ancienFileId) {
      await deleteFileFromGridFS(ancienFileId);
    }

    const filename = `${livre.slug || id}.${extension}`;
    const uploaded = await uploadFileToGridFS(file.buffer, filename, file.mimetype, {
      livreId: livre._id,
      slug: livre.slug,
      format: extension,
      originalName: file.originalname,
    });

    // Extraction automatique du contenu du PDF pour alimenter les chapitres natifs
    if (extension === "pdf") {
      try {
        const { numPages } = await extractAndPopulatePdfChapters(file.buffer, livre);
        if (numPages && numPages > 0) {
          livre.pages = numPages;
        }
      } catch (err) {
        console.warn(`[Livre] Impossible d'extraire le texte du PDF pour ${livre.slug}:`, err.message);
      }
    }

    livre.fichiers = {
      ...livre.fichiers,
      [`${extension}FileId`]: uploaded.fileId,
      [`${extension}Url`]: `/api/v1/bibliotheque/lecture/${livre.slug}`,
    };
    await livre.save({ validateBeforeSave: false });
    return livre;
  }

  static async getAllLivres({
    page = 1,
    limit = 100,
    categorie,
    format,
    prixMin,
    prixMax,
    disponible,
    aLaUne,
    tri,
    q,
    admin = false,
  } = {}) {
    const filter = {};

    if (!admin) {
      // Catalogue public : tout sauf les livres explicitement retirés de la vente
      filter.disponible = disponible === "false" || disponible === false ? false : { $ne: false };
    } else if (disponible !== undefined) {
      filter.disponible = disponible === "true" || disponible === true;
    }

    if (categorie) {
      const cat = await Category.findOne({
        $or: [{ slug: categorie }, { nom: categorie }],
        type: "livre",
      });
      if (cat) filter.categorie = cat._id;
    }

    if (format) {
      filter.formats = format;
    }

    if (prixMin !== undefined || prixMax !== undefined) {
      filter.prix = {};
      if (prixMin !== undefined) filter.prix.$gte = Number(prixMin);
      if (prixMax !== undefined) filter.prix.$lte = Number(prixMax);
    }

    if (aLaUne === "true" || aLaUne === true) {
      filter.aLaUne = true;
    }

    if (q) {
      filter.$or = [
        { titre: { $regex: q, $options: "i" } },
        { sousTitre: { $regex: q, $options: "i" } },
        { resume: { $regex: q, $options: "i" } },
        { isbn: { $regex: q, $options: "i" } },
      ];
    }

    let sortOption = { publication: -1 };
    if (tri === "prix-asc") sortOption = { prix: 1 };
    if (tri === "prix-desc") sortOption = { prix: -1 };
    if (tri === "titre") sortOption = { titre: 1 };
    if (tri === "popularite") sortOption = { ventesCount: -1, lecturesCount: -1 };

    const skip = (page - 1) * limit;
    const pageLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const [livres, total] = await Promise.all([
      Livre.find(filter)
        .populate("auteur", "nom slug role photo")
        .populate("categorie", "nom slug")
        .sort(sortOption)
        .skip(skip)
        .limit(pageLimit),
      Livre.countDocuments(filter),
    ]);

    return {
      livres: admin ? livres : livres.map((livre) => this.masquerFichiers(livre)),
      pagination: {
        page: Number(page),
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit) || 1,
      },
    };
  }

  static async getLivreBySlug(slugOrId) {
    let livre = await Livre.findOne({ slug: slugOrId })
      .populate("auteur", "nom slug role bio photo reseaux")
      .populate("categorie", "nom slug");

    if (!livre && slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      livre = await Livre.findById(slugOrId)
        .populate("auteur", "nom slug role bio photo reseaux")
        .populate("categorie", "nom slug");
    }

    if (!livre) {
      throw new AppError("Livre introuvable", 404);
    }

    // Ouvrages du même auteur
    const memeAuteur = await Livre.find({
      auteur: livre.auteur._id,
      _id: { $ne: livre._id },
      disponible: true,
    })
      .populate("auteur", "nom slug")
      .limit(4);

    return {
      livre: this.masquerFichiers(livre),
      memeAuteur: memeAuteur.map((ouvrage) => this.masquerFichiers(ouvrage)),
    };
  }

  static async getApercuLivre(slugOrId) {
    const { livre } = await this.getLivreBySlug(slugOrId);
    return {
      slug: livre.slug,
      titre: livre.titre,
      auteur: livre.auteur,
      pages: livre.pages,
      apercuPages: livre.apercuPages,
      apercuPourcent: livre.apercuPourcent,
      chapitres: livre.chapitres,
    };
  }

  static async createLivre(data) {
    const slug = slugify(data.titre);
    const existing = await Livre.findOne({ slug });
    if (existing) {
      throw new AppError(`Un livre avec le titre '${data.titre}' existe déjà`, 409);
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
        type: "livre",
      });
      if (!cat) {
        cat = await Category.create({ nom: categorieId, type: "livre" });
      }
      categorieId = cat._id;
    }

    // Traitement des formats si passés en chaîne
    let formats = data.formats;
    if (typeof formats === "string") {
      formats = formats.split(",").map((f) => f.trim()).filter(Boolean);
    }

    // Génération automatique des chapitres par défaut si non fournis
    const nbChapitres = Math.min(Math.max(Number(data.nombreChapitres) || 6, 1), 100);
    let chapitres = data.chapitres;
    if (!chapitres || chapitres.length === 0) {
      const pagesTotales = Number(data.pages) || 200;
      const pagesParChapitre = Math.round(pagesTotales / nbChapitres);
      chapitres = Array.from({ length: nbChapitres }, (_, i) => ({
        titre: `Chapitre ${i + 1}`,
        pages: Array.from({ length: pagesParChapitre }, (_, p) => i * pagesParChapitre + p + 1),
        gratuit: i < 2,
      }));
    }

    const payload = await resolveCloudinaryMediaFields(data, {
      folder: "itobe/livres",
      galleryKey: null,
      htmlKeys: ["resume"],
    });

    const livre = await Livre.create({
      ...payload,
      slug,
      auteur: auteurId,
      categorie: categorieId,
      formats: formats || ["PDF", "EPUB"],
      nombreChapitres: nbChapitres,
      chapitres,
      resume: String(payload.resume ?? "").trim() || "Résumé à compléter.",
      prix: Number(payload.prix),
      prixPapier:
        payload.prixPapier != null && Number(payload.prixPapier) > 0 ? Number(payload.prixPapier) : null,
      promo: payload.promo ? Number(payload.promo) : null,
      stock: Number(payload.stock) || 0,
      pages: Number(payload.pages) || 100,
    });

    return await livre.populate(["auteur", "categorie"]);
  }

  static async updateLivre(id, data) {
    if (data.titre) {
      data.slug = slugify(data.titre);
    }

    if (data.auteur && typeof data.auteur === "string" && !data.auteur.match(/^[0-9a-fA-F]{24}$/)) {
      const auteur = await Auteur.findOne({ slug: data.auteur });
      if (auteur) data.auteur = auteur._id;
    }

    if (data.categorie && typeof data.categorie === "string" && !data.categorie.match(/^[0-9a-fA-F]{24}$/)) {
      const cat = await Category.findOne({
        $or: [{ slug: slugify(data.categorie) }, { nom: data.categorie }],
        type: "livre",
      });
      if (cat) data.categorie = cat._id;
    }

    if (typeof data.formats === "string") {
      data.formats = data.formats.split(",").map((f) => f.trim()).filter(Boolean);
    }

    if (data.prixPapier !== undefined) {
      data.prixPapier =
        data.prixPapier != null && Number(data.prixPapier) > 0 ? Number(data.prixPapier) : null;
    }

    const payload = await resolveCloudinaryMediaFields(data, {
      folder: "itobe/livres",
      galleryKey: null,
      htmlKeys: ["resume"],
    });

    const livre = await Livre.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate(["auteur", "categorie"]);

    if (!livre) {
      throw new AppError("Livre introuvable", 404);
    }

    return livre;
  }

  static async deleteLivre(id) {
    const livre = await Livre.findByIdAndDelete(id);
    if (!livre) {
      throw new AppError("Livre introuvable", 404);
    }
    if (livre.fichiers?.pdfFileId) {
      await deleteFileFromGridFS(livre.fichiers.pdfFileId);
    }
    if (livre.fichiers?.epubFileId) {
      await deleteFileFromGridFS(livre.fichiers.epubFileId);
    }
    return livre;
  }
}
