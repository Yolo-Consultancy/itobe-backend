import mongoose from "mongoose";
import { Chapitre } from "./chapitre.model.js";
import { VersionChapitre } from "./version-chapitre.model.js";
import { Livre } from "../livres/livre.model.js";
import { Auteur } from "../auteurs/auteur.model.js";
import { BibliothequeService } from "../bibliotheque/bibliotheque.service.js";
import { AppError } from "../../utils/api-error.js";

export class ChapitreService {
  /**
   * Résout un livre par son ObjectId ou son slug
   */
  static async resoudreLivre(livreIdOrSlug) {
    let livre = null;
    if (mongoose.Types.ObjectId.isValid(livreIdOrSlug)) {
      livre = await Livre.findById(livreIdOrSlug).populate("auteur");
    }
    if (!livre) {
      livre = await Livre.findOne({ slug: livreIdOrSlug }).populate("auteur");
    }
    if (!livre) {
      throw new AppError("Livre introuvable", 404);
    }
    return livre;
  }

  /**
   * Vérifie si un utilisateur possède les droits d'édition sur un livre donné.
   * Rôles autorisés : 'admin', 'editeur', ou 'lecteur' si profil Auteur lié à ce compte.
   */
  static async verifierDroitsEdition(user, livreIdOrDoc) {
    if (!user) {
      throw new AppError("Authentification requise pour cette action.", 401);
    }

    if (user.role === "admin" || user.role === "editeur") {
      return true;
    }

    let livre = livreIdOrDoc;
    if (!(livre && livre.auteur)) {
      livre = await this.resoudreLivre(livreIdOrDoc);
    }

    // Vérifier si l'auteur du livre correspond à l'utilisateur connecté
    const auteurId = livre.auteur?._id || livre.auteur;
    if (auteurId) {
      const auteurDoc = await Auteur.findById(auteurId);
      if (auteurDoc && auteurDoc.user && auteurDoc.user.toString() === user._id.toString()) {
        return true;
      }
    }

    throw new AppError(
      "Vous n'avez pas les autorisations requises pour modifier les chapitres de ce livre.",
      403
    );
  }

  /**
   * Récupère la liste des chapitres d'un livre avec filtrage de sécurité selon l'accès.
   */
  static async getChapitresByLivre(livreIdOrSlug, user = null) {
    const livre = await this.resoudreLivre(livreIdOrSlug);

    // Vérifier si l'utilisateur a les droits d'édition
    let aDroitsEdition = false;
    if (user) {
      try {
        aDroitsEdition = await this.verifierDroitsEdition(user, livre);
      } catch {
        aDroitsEdition = false;
      }
    }

    // Vérifier l'accès lecture complet pour les lecteurs
    let aAccesLectureComplet = false;
    if (!aDroitsEdition && user) {
      const verif = await BibliothequeService.verifierAccesLecture(user._id, livre._id);
      aAccesLectureComplet = Boolean(verif?.accesComplet);
    }

    // Critères de recherche : éditeurs voient tous les statuts, le public voit seulement 'Publié'
    const filtre = { livre: livre._id };
    if (!aDroitsEdition) {
      filtre.statut = "Publié";
    }

    const chapitres = await Chapitre.find(filtre)
      .sort({ ordre: 1, createdAt: 1 })
      .populate("derniereModificationPar", "nom prenom email");

    // Formatage des résultats selon les droits
    return chapitres.map((chapitre) => {
      const chapObj = chapitre.toJSON();
      const autoriseContenu = aDroitsEdition || aAccesLectureComplet || chapObj.gratuit;

      if (!autoriseContenu) {
        // Masquer le contenu complet pour les chapitres verrouillés
        delete chapObj.contenu;
        chapObj.verrouille = true;
      } else {
        chapObj.verrouille = false;
      }

      return chapObj;
    });
  }

  /**
   * Récupère un chapitre par son ID avec vérification des droits d'accès.
   */
  static async getChapitreById(chapitreId, user = null) {
    const chapitre = await Chapitre.findById(chapitreId)
      .populate({
        path: "livre",
        populate: { path: "auteur" },
      })
      .populate("derniereModificationPar", "nom prenom email");

    if (!chapitre) {
      throw new AppError("Chapitre introuvable", 404);
    }

    const livre = chapitre.livre;
    let aDroitsEdition = false;
    if (user) {
      try {
        aDroitsEdition = await this.verifierDroitsEdition(user, livre);
      } catch {
        aDroitsEdition = false;
      }
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
            "Achetez cet ouvrage ou souscrivez à un abonnement pour lire ce chapitre.",
            403
          );
        }
      }
    }

    return chapitre;
  }

  /**
   * Crée un nouveau chapitre pour un livre.
   */
  static async createChapitre(livreIdOrSlug, data, user) {
    const livre = await this.resoudreLivre(livreIdOrSlug);
    await this.verifierDroitsEdition(user, livre);

    let ordre = data.ordre;
    if (ordre === undefined || ordre === null) {
      const dernier = await Chapitre.findOne({ livre: livre._id }).sort({ ordre: -1 });
      ordre = dernier ? dernier.ordre + 1 : 1;
    }

    const chapitre = await Chapitre.create({
      livre: livre._id,
      titre: data.titre,
      slug: data.slug,
      ordre,
      contenu: data.contenu || { type: "doc", content: [] },
      statut: data.statut || "Brouillon",
      gratuit: Boolean(data.gratuit),
      pages: Array.isArray(data.pages) ? data.pages : [],
      revision: 1,
      derniereModificationPar: user._id,
    });

    return chapitre;
  }

  /**
   * Met à jour un chapitre avec verrouillage de concurrence optimiste (révision).
   */
  static async updateChapitre(chapitreId, data, user) {
    const chapitre = await Chapitre.findById(chapitreId);
    if (!chapitre) {
      throw new AppError("Chapitre introuvable", 404);
    }

    await this.verifierDroitsEdition(user, chapitre.livre);

    // Contrôle de concurrence optimiste
    if (data.revision !== undefined && data.revision !== null) {
      const revisionEnvoyee = Number(data.revision);
      if (revisionEnvoyee !== chapitre.revision) {
        const err = new AppError(
          `Conflit de révision : le chapitre est actuellement à la révision ${chapitre.revision}, mais vous tentez d'écraser avec la révision ${revisionEnvoyee}.`,
          409
        );
        err.details = {
          revisionActuelle: chapitre.revision,
          revisionEnvoyee,
          chapitreActuel: {
            _id: chapitre._id,
            titre: chapitre.titre,
            revision: chapitre.revision,
            updatedAt: chapitre.updatedAt,
          },
        };
        throw err;
      }
    }

    // Mise à jour des champs autorisés
    if (data.titre !== undefined) chapitre.titre = data.titre;
    if (data.slug !== undefined) chapitre.slug = data.slug;
    if (data.ordre !== undefined) chapitre.ordre = data.ordre;
    if (data.contenu !== undefined) chapitre.contenu = data.contenu;
    if (data.statut !== undefined) chapitre.statut = data.statut;
    if (data.gratuit !== undefined) chapitre.gratuit = Boolean(data.gratuit);
    if (data.pages !== undefined) chapitre.pages = Array.isArray(data.pages) ? data.pages : [];

    // Incrément de la révision
    chapitre.revision = (chapitre.revision || 1) + 1;
    chapitre.derniereModificationPar = user._id;

    await chapitre.save();
    return chapitre;
  }

  /**
   * Réordonne une liste de chapitres pour un livre.
   */
  static async reordonnerChapitres(livreIdOrSlug, chapitresOrdres, user) {
    const livre = await this.resoudreLivre(livreIdOrSlug);
    await this.verifierDroitsEdition(user, livre);

    if (!Array.isArray(chapitresOrdres)) {
      throw new AppError("Le corps de la requête doit être une liste [{ id, ordre }].", 400);
    }

    const bulkOps = chapitresOrdres.map(({ id, ordre }) => ({
      updateOne: {
        filter: { _id: id, livre: livre._id },
        update: { $set: { ordre: Number(ordre) } },
      },
    }));

    if (bulkOps.length > 0) {
      await Chapitre.bulkWrite(bulkOps);
    }

    return this.getChapitresByLivre(livre._id, user);
  }

  /**
   * Supprime un chapitre et ses snapshots historiques.
   */
  static async deleteChapitre(chapitreId, user) {
    const chapitre = await Chapitre.findById(chapitreId);
    if (!chapitre) {
      throw new AppError("Chapitre introuvable", 404);
    }

    await this.verifierDroitsEdition(user, chapitre.livre);

    await Promise.all([
      Chapitre.findByIdAndDelete(chapitreId),
      VersionChapitre.deleteMany({ chapitre: chapitreId }),
    ]);

    return { success: true, message: `Chapitre « ${chapitre.titre} » supprimé avec succès.` };
  }

  /**
   * Crée un snapshot historique restaurable pour un chapitre.
   */
  static async creerVersion(chapitreId, data, user) {
    const chapitre = await Chapitre.findById(chapitreId);
    if (!chapitre) {
      throw new AppError("Chapitre introuvable", 404);
    }

    await this.verifierDroitsEdition(user, chapitre.livre);

    const version = await VersionChapitre.create({
      chapitre: chapitre._id,
      livre: chapitre.livre,
      revision: chapitre.revision,
      titre: chapitre.titre,
      contenu: chapitre.contenu,
      description: (data?.description || "Point de sauvegarde").trim(),
      creePar: user._id,
    });

    return version;
  }

  /**
   * Liste l'historique des versions d'un chapitre.
   */
  static async getVersionsChapitre(chapitreId, user) {
    const chapitre = await Chapitre.findById(chapitreId);
    if (!chapitre) {
      throw new AppError("Chapitre introuvable", 404);
    }

    await this.verifierDroitsEdition(user, chapitre.livre);

    const versions = await VersionChapitre.find({ chapitre: chapitre._id })
      .populate("creePar", "nom prenom email")
      .sort({ createdAt: -1 });

    return versions;
  }

  /**
   * Restaure une version passée sur le chapitre courant.
   */
  static async restaurerVersion(chapitreId, versionId, user) {
    const chapitre = await Chapitre.findById(chapitreId);
    if (!chapitre) {
      throw new AppError("Chapitre introuvable", 404);
    }

    await this.verifierDroitsEdition(user, chapitre.livre);

    const version = await VersionChapitre.findById(versionId);
    if (!version || version.chapitre.toString() !== chapitre._id.toString()) {
      throw new AppError("Version d'historique introuvable pour ce chapitre", 404);
    }

    // Sauvegarder l'état avant restauration comme snapshot
    await VersionChapitre.create({
      chapitre: chapitre._id,
      livre: chapitre.livre,
      revision: chapitre.revision,
      titre: chapitre.titre,
      contenu: chapitre.contenu,
      description: `Sauvegarde automatique avant restauration de la révision ${version.revision}`,
      creePar: user._id,
    });

    chapitre.titre = version.titre;
    chapitre.contenu = version.contenu;
    chapitre.revision = (chapitre.revision || 1) + 1;
    chapitre.derniereModificationPar = user._id;

    await chapitre.save();
    return chapitre;
  }
}
