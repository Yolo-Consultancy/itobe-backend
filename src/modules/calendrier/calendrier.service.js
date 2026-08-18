import { Article } from "../articles/article.model.js";
import { Actualite } from "../actualites/actualite.model.js";
import { Livre } from "../livres/livre.model.js";

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function bornesDuMois(mois) {
  const [a, m] = (mois || new Date().toISOString().slice(0, 7)).split("-").map(Number);
  const debut = new Date(Date.UTC(a || 2026, (m || 1) - 1, 1));
  const fin = new Date(Date.UTC(a || 2026, m || 1, 0));
  return { debut: iso(debut), fin: iso(fin) };
}

export class CalendrierService {
  static async getEditorialElements({ debut, fin, mois }) {
    const defauts = bornesDuMois(mois);
    const dateDebut = debut && /^\d{4}-\d{2}-\d{2}$/.test(debut) ? debut : defauts.debut;
    const dateFin = fin && /^\d{4}-\d{2}-\d{2}$/.test(fin) ? fin : defauts.fin;

    const debutDate = new Date(`${dateDebut}T00:00:00.000Z`);
    const finDate = new Date(`${dateFin}T23:59:59.999Z`);

    const [articles, actualites, livres] = await Promise.all([
      Article.find({
        datePublication: { $gte: debutDate, $lte: finDate },
      })
        .populate("auteur", "nom slug")
        .populate("categorie", "nom slug"),

      Actualite.find({
        date: { $gte: debutDate, $lte: finDate },
      }).populate("categorie", "nom slug"),

      Livre.find({
        publication: { $gte: debutDate, $lte: finDate },
      })
        .populate("auteur", "nom slug")
        .populate("categorie", "nom slug"),
    ]);

    const elements = [
      ...articles.map((a) => ({
        id: a._id.toString(),
        type: "article",
        titre: a.titre,
        date: iso(a.datePublication),
        statut: a.statut,
        categorie: a.categorie?.nom || "Média",
        auteur: a.auteur?.nom || "",
        lien: `/admin/articles`,
      })),
      ...actualites.map((act) => ({
        id: act._id.toString(),
        type: "actualite",
        titre: act.titre,
        date: iso(act.date),
        statut: act.etat || "Publié",
        categorie: act.categorieNom || act.categorie?.nom || "Actualités",
        auteur: "Rédaction",
        lien: `/admin/actualites`,
      })),
      ...livres.map((l) => ({
        id: l._id.toString(),
        type: "livre",
        titre: l.titre,
        date: iso(l.publication),
        statut: l.disponible ? "En vente" : "Épuisé",
        categorie: l.categorie?.nom || "Édition",
        auteur: l.auteur?.nom || "",
        lien: `/admin/livres`,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return {
      periode: { debut: dateDebut, fin: dateFin },
      total: elements.length,
      elements,
    };
  }
}
