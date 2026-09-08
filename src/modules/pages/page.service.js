import mongoose from "mongoose";
import { Page } from "./page.model.js";
import { Chapitre } from "../chapitres/chapitre.model.js";
import { ChapitreService } from "../chapitres/chapitre.service.js";
import { BibliothequeService } from "../bibliotheque/bibliotheque.service.js";
import { AppError } from "../../utils/api-error.js";

export class PageService {
  /**
   * Charge un chapitre et vérifie les droits de lecture (éditeur / gratuit / bibliothèque).
   * @returns {{ chapitre, livre, aDroitsEdition: boolean }}
   */
  static async resoudreChapitreAvecAcces(chapitreId, user = null, { exigerEdition = false } = {}) {
    if (!mongoose.Types.ObjectId.isValid(chapitreId)) {
      throw new AppError("Identifiant de chapitre invalide", 400);
    }

    const chapitre = await Chapitre.findById(chapitreId).populate({
      path: "livre",
      populate: { path: "auteur" },
    });

    if (!chapitre) {
      throw new AppError("Chapitre introuvable", 404);
    }

    const livre = chapitre.livre;
    if (!livre) {
      throw new AppError("Livre associé au chapitre introuvable", 404);
    }

    let aDroitsEdition = false;
    if (user) {
      try {
        aDroitsEdition = await ChapitreService.verifierDroitsEdition(user, livre);
      } catch {
        aDroitsEdition = false;
      }
    }

    if (exigerEdition) {
      await ChapitreService.verifierDroitsEdition(user, livre);
      return { chapitre, livre, aDroitsEdition: true };
    }

    if (!aDroitsEdition) {
      if (chapitre.statut !== "Publié") {
        throw new AppError("Ce chapitre n'est pas encore disponible.", 404);
      }

      if (!chapitre.gratuit) {
        if (!user) {
          throw new AppError("Connexion requise pour accéder à ce chapitre.", 401);
        }
        const verif = await BibliothequeService.verifierAccesLecture(user._id, livre._id);
        if (!verif?.accesComplet) {
          throw new AppError(
            "Achetez cet ouvrage ou souscrivez à un abonnement pour lire ce contenu.",
            403,
          );
        }
      }
    }

    return { chapitre, livre, aDroitsEdition };
  }

  /**
   * Liste les pages d'un chapitre, triées par ordre.
   * Masque le contenu si le chapitre est verrouillé pour le lecteur.
   */
  static async getPagesByChapitre(chapitreId, user = null) {
    const { chapitre, aDroitsEdition } = await this.resoudreChapitreAvecAcces(chapitreId, user);

    let aAccesLectureComplet = aDroitsEdition;
    if (!aDroitsEdition && user) {
      const verif = await BibliothequeService.verifierAccesLecture(user._id, chapitre.livre._id);
      aAccesLectureComplet = Boolean(verif?.accesComplet);
    }

    const autoriseContenu = aDroitsEdition || aAccesLectureComplet || chapitre.gratuit;

    const pages = await Page.find({ chapitre: chapitre._id })
      .sort({ ordre: 1, createdAt: 1 })
      .populate("derniereModificationPar", "nom prenom email");

    return pages.map((page) => {
      const obj = page.toJSON();
      if (!autoriseContenu) {
        delete obj.contenu;
        obj.verrouille = true;
      } else {
        obj.verrouille = false;
      }
      return obj;
    });
  }

  /**
   * Récupère une page par ID (mêmes règles d'accès que le chapitre parent).
   */
  static async getPageById(pageId, user = null) {
    if (!mongoose.Types.ObjectId.isValid(pageId)) {
      throw new AppError("Identifiant de page invalide", 400);
    }

    const page = await Page.findById(pageId).populate(
      "derniereModificationPar",
      "nom prenom email",
    );

    if (!page) {
      throw new AppError("Page introuvable", 404);
    }

    await this.resoudreChapitreAvecAcces(page.chapitre, user);
    return page;
  }

  /**
   * Crée une page éditoriale dans un chapitre.
   * Ordre auto = max(ordre) + 1 si non fourni.
   */
  static async createPage(chapitreId, data, user) {
    const { chapitre, livre } = await this.resoudreChapitreAvecAcces(chapitreId, user, {
      exigerEdition: true,
    });

    let ordre = data.ordre;
    if (ordre === undefined || ordre === null) {
      const derniere = await Page.findOne({ chapitre: chapitre._id }).sort({ ordre: -1 });
      ordre = derniere ? derniere.ordre + 1 : 1;
    } else {
      ordre = Number(ordre);
      if (!Number.isFinite(ordre) || ordre < 1) {
        throw new AppError("L'ordre de la page doit être un entier ≥ 1.", 400);
      }
      const conflit = await Page.exists({ chapitre: chapitre._id, ordre });
      if (conflit) {
        throw new AppError(`Une page existe déjà à l'ordre ${ordre} dans ce chapitre.`, 409);
      }
    }

    const titre =
      typeof data.titre === "string" && data.titre.trim()
        ? data.titre.trim()
        : `Page ${ordre}`;

    const page = await Page.create({
      chapitre: chapitre._id,
      livre: livre._id,
      titre,
      ordre,
      contenu: data.contenu || { type: "doc", content: [] },
      revision: 1,
      derniereModificationPar: user._id,
    });

    return page;
  }

  /**
   * Met à jour une page (titre, contenu, ordre) avec verrouillage optimiste via revision.
   */
  static async updatePage(pageId, data, user) {
    if (!mongoose.Types.ObjectId.isValid(pageId)) {
      throw new AppError("Identifiant de page invalide", 400);
    }

    const page = await Page.findById(pageId);
    if (!page) {
      throw new AppError("Page introuvable", 404);
    }

    await this.resoudreChapitreAvecAcces(page.chapitre, user, { exigerEdition: true });

    if (data.revision !== undefined && data.revision !== null) {
      const revisionEnvoyee = Number(data.revision);
      if (revisionEnvoyee !== page.revision) {
        const err = new AppError(
          `Conflit de révision : la page est à la révision ${page.revision}, mais vous envoyez la révision ${revisionEnvoyee}.`,
          409,
        );
        err.details = {
          revisionActuelle: page.revision,
          revisionEnvoyee,
          pageActuelle: {
            _id: page._id,
            titre: page.titre,
            revision: page.revision,
            updatedAt: page.updatedAt,
          },
        };
        throw err;
      }
    }

    if (data.titre !== undefined) page.titre = String(data.titre).trim();
    if (data.contenu !== undefined) page.contenu = data.contenu;

    if (data.ordre !== undefined && data.ordre !== null) {
      const nouvelOrdre = Number(data.ordre);
      if (!Number.isFinite(nouvelOrdre) || nouvelOrdre < 1) {
        throw new AppError("L'ordre de la page doit être un entier ≥ 1.", 400);
      }
      if (nouvelOrdre !== page.ordre) {
        const conflit = await Page.exists({
          chapitre: page.chapitre,
          ordre: nouvelOrdre,
          _id: { $ne: page._id },
        });
        if (conflit) {
          throw new AppError(
            `Une page existe déjà à l'ordre ${nouvelOrdre}. Utilisez l'endpoint de réordonnancement.`,
            409,
          );
        }
        page.ordre = nouvelOrdre;
      }
    }

    page.revision = (page.revision || 1) + 1;
    page.derniereModificationPar = user._id;
    await page.save();
    return page;
  }

  /**
   * Réordonne les pages d'un chapitre.
   * Corps attendu : [{ id, ordre }] ou { pages: [{ id, ordre }] }
   * Deux phases pour respecter l'index unique { chapitre, ordre }.
   */
  static async reordonnerPages(chapitreId, pagesOrdres, user) {
    const { chapitre } = await this.resoudreChapitreAvecAcces(chapitreId, user, {
      exigerEdition: true,
    });

    const liste = Array.isArray(pagesOrdres) ? pagesOrdres : pagesOrdres?.pages;
    if (!Array.isArray(liste) || liste.length === 0) {
      throw new AppError("Le corps doit être une liste [{ id, ordre }].", 400);
    }

    const ids = liste.map((p) => p.id || p._id).filter(Boolean);
    const pagesExistantes = await Page.find({
      _id: { $in: ids },
      chapitre: chapitre._id,
    });

    if (pagesExistantes.length !== ids.length) {
      throw new AppError(
        "Une ou plusieurs pages n'appartiennent pas à ce chapitre.",
        400,
      );
    }

    const ordres = liste.map((p) => Number(p.ordre));
    if (ordres.some((o) => !Number.isFinite(o) || o < 1)) {
      throw new AppError("Chaque ordre doit être un entier ≥ 1.", 400);
    }
    if (new Set(ordres).size !== ordres.length) {
      throw new AppError("Les ordres fournis doivent être uniques.", 400);
    }

    // Phase 1 : slots temporaires négatifs (évite les collisions unique)
    await Page.bulkWrite(
      liste.map((item, index) => ({
        updateOne: {
          filter: { _id: item.id || item._id, chapitre: chapitre._id },
          update: { $set: { ordre: -(index + 1) } },
        },
      })),
    );

    // Phase 2 : ordres finaux
    await Page.bulkWrite(
      liste.map((item) => ({
        updateOne: {
          filter: { _id: item.id || item._id, chapitre: chapitre._id },
          update: { $set: { ordre: Number(item.ordre) } },
        },
      })),
    );

    return this.getPagesByChapitre(chapitre._id, user);
  }

  /**
   * Supprime une page puis compacte les ordres restants (1..n).
   */
  static async deletePage(pageId, user) {
    if (!mongoose.Types.ObjectId.isValid(pageId)) {
      throw new AppError("Identifiant de page invalide", 400);
    }

    const page = await Page.findById(pageId);
    if (!page) {
      throw new AppError("Page introuvable", 404);
    }

    await this.resoudreChapitreAvecAcces(page.chapitre, user, { exigerEdition: true });

    const titre = page.titre || `Page ${page.ordre}`;
    const chapitreId = page.chapitre;

    await Page.findByIdAndDelete(pageId);

    const restantes = await Page.find({ chapitre: chapitreId }).sort({ ordre: 1 });
    if (restantes.length > 0) {
      await Page.bulkWrite(
        restantes.map((p, index) => ({
          updateOne: {
            filter: { _id: p._id },
            update: { $set: { ordre: -(index + 1) } },
          },
        })),
      );
      await Page.bulkWrite(
        restantes.map((p, index) => ({
          updateOne: {
            filter: { _id: p._id },
            update: { $set: { ordre: index + 1 } },
          },
        })),
      );
    }

    return {
      success: true,
      message: `Page « ${titre} » supprimée avec succès.`,
    };
  }
}
