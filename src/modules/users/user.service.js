import { User } from "./user.model.js";
import { AppError } from "../../utils/api-error.js";

export class UserService {
  static async getAllUsers({ page = 1, limit = 20, role, statut, q } = {}) {
    const filter = {};
    if (role && role !== "Tous") filter.role = role;
    if (statut && statut !== "Tous") filter.statut = statut;
    if (q) {
      filter.$or = [
        { nom: { $regex: q, $options: "i" } },
        { prenom: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }
    return user;
  }

  static async createUser(userData) {
    const existing = await User.findOne({ email: userData.email.toLowerCase().trim() });
    if (existing) {
      throw new AppError("Un utilisateur avec cette adresse e-mail existe déjà", 409);
    }

    const user = await User.create({
      ...userData,
      email: userData.email.toLowerCase().trim(),
    });

    return user;
  }

  static async updateUser(id, updateData) {
    // Si modification du mot de passe dans update générique, le traiter avec précaution
    if (updateData.password) {
      delete updateData.password;
    }

    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
      const existing = await User.findOne({ email: updateData.email, _id: { $ne: id } });
      if (existing) {
        throw new AppError("Cette adresse e-mail est déjà utilisée par un autre compte", 409);
      }
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }

    return user;
  }

  static async deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }
    return user;
  }
}
