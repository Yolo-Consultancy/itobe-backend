import { Category } from "./category.model.js";
import { AppError } from "../../utils/api-error.js";
import { slugify } from "../../utils/slugify.js";

export class CategoryService {
  static async getCategories({ type, visibilite, q } = {}) {
    const filter = {};
    if (type) filter.type = type;
    if (visibilite && visibilite !== "Tous") filter.visibilite = visibilite;
    if (q) filter.nom = { $regex: q, $options: "i" };

    const categories = await Category.find(filter).sort({ nom: 1 });
    return categories;
  }

  static async getCategoryById(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new AppError("Catégorie introuvable", 404);
    }
    return category;
  }

  static async createCategory({ nom, type, visibilite }) {
    const slug = slugify(nom);
    const existing = await Category.findOne({ slug, type });
    if (existing) {
      throw new AppError(`La catégorie '${nom}' existe déjà pour le type '${type}'`, 409);
    }

    const category = await Category.create({
      nom: nom.trim(),
      slug,
      type,
      visibilite: visibilite || "Publique",
    });

    return category;
  }

  static async updateCategory(id, { nom, visibilite, type }) {
    const updateData = {};
    if (nom) {
      updateData.nom = nom.trim();
      updateData.slug = slugify(nom);
    }
    if (visibilite) updateData.visibilite = visibilite;
    if (type) updateData.type = type;

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      throw new AppError("Catégorie introuvable", 404);
    }

    return category;
  }

  static async deleteCategory(id) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new AppError("Catégorie introuvable", 404);
    }
    return category;
  }
}
