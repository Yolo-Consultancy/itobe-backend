import { Bibliotheque } from "./bibliotheque.model.js";
import { Livre } from "../livres/livre.model.js";
import { Abonnement } from "../abonnements/abonnement.model.js";
import { AppError } from "../../utils/api-error.js";

export class BibliothequeService {
  static async getOrCreateBibliotheque(userId) {
    let biblio = await Bibliotheque.findOne({ user: userId });
    if (!biblio) {
      biblio = await Bibliotheque.create({
        user: userId,
        achetes: [],
        favoris: [],
        telecharges: [],
        progressions: [],
        marquePages: [],
        appareils: [
          {
            idAppareil: "default-device",
            nom: "Mon Appareil",
            typeAppareil: "Mobile",
            derniereSync: new Date(),
            page: 1,
            actuel: true,
          },
        ],
      });
    }
    return biblio;
  }

  static async getUserLibrary(userId) {
    const biblio = await this.getOrCreateBibliotheque(userId);
    await biblio.populate([
      { path: "achetes.livre", populate: { path: "auteur", select: "nom slug" } },
      { path: "favoris", populate: { path: "auteur", select: "nom slug" } },
      { path: "telecharges", populate: { path: "auteur", select: "nom slug" } },
      { path: "progressions.livre", populate: { path: "auteur", select: "nom slug" } },
      { path: "marquePages.livre", select: "titre slug" },
    ]);

    // Formatage prêt pour l'affichage frontend
    const formatLivre = (l) => {
      if (!l) return null;
      return {
        id: l._id,
        slug: l.slug,
        titre: l.titre,
        auteur: l.auteur?.nom || "Auteur",
        couleur: l.couleur,
        couverture: l.couverture,
        formats: l.formats,
        pages: l.pages,
      };
    };

    const achetes = biblio.achetes.map((a) => formatLivre(a.livre)).filter(Boolean);
    const favoris = biblio.favoris.map((f) => formatLivre(f)).filter(Boolean);
    const telecharges = biblio.telecharges.map((t) => formatLivre(t)).filter(Boolean);

    const progressions = {};
    biblio.progressions.forEach((p) => {
      if (p.livre?.slug) {
        progressions[p.livre.slug] = p.pourcentage;
      }
    });

    const enCours = biblio.progressions
      .filter((p) => p.pourcentage > 0 && p.pourcentage < 100)
      .map((p) => ({
        ...formatLivre(p.livre),
        page: p.page,
        pourcentage: p.pourcentage,
      }));

    return {
      achetes,
      favoris,
      telecharges,
      progressions,
      enCours,
      marquePages: biblio.marquePages,
      appareils: biblio.appareils,
      historiqueSync: biblio.historiqueSync,
    };
  }

  static async ajouterLivreAchete(userId, livreId) {
    const biblio = await this.getOrCreateBibliotheque(userId);
    const dejaAchete = biblio.achetes.some((a) => a.livre.toString() === livreId.toString());

    if (!dejaAchete) {
      biblio.achetes.push({ livre: livreId, dateAchat: new Date() });
      await biblio.save();
    }
    return biblio;
  }

  static async toggleFavori(userId, livreSlugOrId) {
    const livre = await this._resoudreLivre(livreSlugOrId);
    const biblio = await this.getOrCreateBibliotheque(userId);

    const index = biblio.favoris.findIndex((f) => f.toString() === livre._id.toString());
    let estFavori = false;

    if (index > -1) {
      biblio.favoris.splice(index, 1);
      estFavori = false;
    } else {
      biblio.favoris.push(livre._id);
      estFavori = true;
    }

    await biblio.save();
    return { estFavori, livre: livre.slug };
  }

  static async enregistrerTelechargement(userId, livreSlugOrId) {
    const livre = await this._resoudreLivre(livreSlugOrId);
    const biblio = await this.getOrCreateBibliotheque(userId);

    if (!biblio.telecharges.some((t) => t.toString() === livre._id.toString())) {
      biblio.telecharges.push(livre._id);
      await biblio.save();
      livre.telechargementsCount += 1;
      await livre.save({ validateBeforeSave: false });
    }

    return { telecharge: true, livre: livre.slug };
  }

  static async mettreAJourProgression(userId, { livreSlugOrId, page, pourcentage }) {
    const livre = await this._resoudreLivre(livreSlugOrId);
    const biblio = await this.getOrCreateBibliotheque(userId);

    const index = biblio.progressions.findIndex((p) => p.livre.toString() === livre._id.toString());
    const pct = pourcentage ?? Math.min(100, Math.round((page / livre.pages) * 100));

    if (index > -1) {
      biblio.progressions[index].page = page;
      biblio.progressions[index].pourcentage = pct;
      biblio.progressions[index].date = new Date();
    } else {
      biblio.progressions.push({
        livre: livre._id,
        page,
        pourcentage: pct,
        date: new Date(),
      });
    }

    await biblio.save();
    return { page, pourcentage: pct, livre: livre.slug };
  }

  static async gererMarquePages(userId, { livreSlugOrId, page, note }) {
    const livre = await this._resoudreLivre(livreSlugOrId);
    const biblio = await this.getOrCreateBibliotheque(userId);

    const index = biblio.marquePages.findIndex(
      (m) => m.livre.toString() === livre._id.toString() && m.page === Number(page)
    );

    let ajoute = false;
    if (index > -1) {
      biblio.marquePages.splice(index, 1);
      ajoute = false;
    } else {
      biblio.marquePages.push({
        livre: livre._id,
        page: Number(page),
        note: note || "",
        date: new Date(),
      });
      ajoute = true;
    }

    await biblio.save();
    return { ajoute, page, livre: livre.slug };
  }

  static async synchroniser(userId, { idAppareil, nom, typeAppareil, page, livreSlugOrId }) {
    const biblio = await this.getOrCreateBibliotheque(userId);
    const now = new Date();

    let appareil = biblio.appareils.find((a) => a.idAppareil === idAppareil);
    if (appareil) {
      appareil.nom = nom || appareil.nom;
      appareil.typeAppareil = typeAppareil || appareil.typeAppareil;
      appareil.derniereSync = now;
      if (page) appareil.page = page;
      appareil.actuel = true;
    } else if (idAppareil) {
      biblio.appareils.push({
        idAppareil,
        nom: nom || "Nouvel appareil",
        typeAppareil: typeAppareil || "Mobile",
        derniereSync: now,
        page: page || 1,
        actuel: true,
      });
    }

    biblio.historiqueSync.unshift({
      date: now,
      action: "Synchronisation",
      details: `Progression mise à jour depuis ${nom || "l'appareil"} — page ${page || 1}`,
    });

    if (biblio.historiqueSync.length > 20) biblio.historiqueSync.pop();

    if (livreSlugOrId && page) {
      await this.mettreAJourProgression(userId, { livreSlugOrId, page });
    }

    await biblio.save();
    return {
      derniereSync: now,
      appareils: biblio.appareils,
    };
  }

  static async verifierAccesLecture(userId, livreSlugOrId) {
    const livre = await this._resoudreLivre(livreSlugOrId);
    const biblio = await this.getOrCreateBibliotheque(userId);

    // 1. Livre acheté à l'unité
    const achete = biblio.achetes.some((a) => a.livre.toString() === livre._id.toString());
    if (achete) return { accesComplet: true, motif: "achat" };

    // 2. Abonnement Premium actif
    const abonnement = await Abonnement.findOne({
      user: userId,
      statut: "actif",
      prochaineEcheance: { $gte: new Date() },
    });
    if (abonnement) return { accesComplet: true, motif: "premium" };

    return {
      accesComplet: false,
      pagesGratuites: livre.apercuPages,
      pourcentageGratuit: livre.apercuPourcent,
    };
  }

  static async _resoudreLivre(slugOrId) {
    let livre = await Livre.findOne({ slug: slugOrId });
    if (!livre && slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      livre = await Livre.findById(slugOrId);
    }
    if (!livre) {
      throw new AppError("Livre introuvable", 404);
    }
    return livre;
  }
}
