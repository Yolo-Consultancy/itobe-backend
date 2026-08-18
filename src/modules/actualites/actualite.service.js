import { Actualite } from "./actualite.model.js";
import { AppError } from "../../utils/api-error.js";

export class ActualiteService {
  static async getAllActualites({ etat, q } = {}) {
    const filter = {};
    if (etat && etat !== "Tous") filter.etat = etat;
    if (q) filter.titre = { $regex: q, $options: "i" };

    const actualites = await Actualite.find(filter).sort({ date: -1 });
    return actualites;
  }

  static async getActualiteById(id) {
    const act = await Actualite.findById(id);
    if (!act) {
      throw new AppError("Actualité introuvable", 404);
    }
    return act;
  }

  static async createActualite(data) {
    const act = await Actualite.create({
      ...data,
      categorieNom: data.categorie || data.categorieNom || "Actualités",
    });
    return act;
  }

  static async updateActualite(id, data) {
    if (data.categorie) {
      data.categorieNom = data.categorie;
    }
    const act = await Actualite.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!act) {
      throw new AppError("Actualité introuvable", 404);
    }
    return act;
  }

  static async deleteActualite(id) {
    const act = await Actualite.findByIdAndDelete(id);
    if (!act) {
      throw new AppError("Actualité introuvable", 404);
    }
    return act;
  }
}
