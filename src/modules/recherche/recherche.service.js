import { Article } from "../articles/article.model.js";
import { Livre } from "../livres/livre.model.js";
import { Auteur } from "../auteurs/auteur.model.js";

export class RechercheService {
  static async search(q, { page = 1, limit = 20 } = {}) {
    if (!q || q.trim().length === 0) {
      return { results: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
    }

    const regex = { $regex: q, $options: "i" };
    const skip = (page - 1) * limit;

    const [articles, livres, auteurs] = await Promise.all([
      Article.find({
        $or: [{ titre: regex }, { contenu: regex }, { tags: regex }],
        statut: "Publié",
      })
        .select("titre slug imageCover categorie createdAt")
        .sort({ createdAt: -1 })
        .limit(10),

      Livre.find({
        $or: [{ titre: regex }, { description: regex }, { tags: regex }],
        statut: "Publié",
      })
        .select("titre slug couverture prix categorie createdAt")
        .sort({ createdAt: -1 })
        .limit(10),

      Auteur.find({
        $or: [{ nom: regex }, { biographie: regex }],
      })
        .select("nom photo")
        .limit(5),
    ]);

    const results = [
      ...articles.map((a) => ({ type: "article", ...a.toObject() })),
      ...livres.map((l) => ({ type: "livre", ...l.toObject() })),
      ...auteurs.map((au) => ({ type: "auteur", ...au.toObject() })),
    ];

    const total = results.length;

    return {
      results: results.slice(skip, skip + Number(limit)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
