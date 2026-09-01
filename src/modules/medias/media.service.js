import { Media } from "./media.model.js";
import { AppError } from "../../utils/api-error.js";
import {
  deleteFromCloudinary,
  isCloudinaryConfigured,
  uploadFileToCloudinary,
} from "../../utils/cloudinary.service.js";

function formaterTaille(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export class MediaService {
  static async getAllMedias({ page = 1, limit = 20, type, q } = {}) {
    const filter = {};
    if (type && type !== "Tous") filter.type = type;
    if (q) filter.nom = { $regex: q, $options: "i" };

    const skip = (page - 1) * limit;
    const [medias, total] = await Promise.all([
      Media.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Media.countDocuments(filter),
    ]);

    return {
      medias,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async uploadFile(file, userId) {
    if (!file) {
      throw new AppError("Aucun fichier fourni", 400);
    }

    let url = `/uploads/${file.filename}`;
    let publicId = "";

    if (isCloudinaryConfigured()) {
      const uploaded = await uploadFileToCloudinary(file, "itobe/medias");
      url = uploaded.url;
      publicId = uploaded.publicId;
    }

    let type = "Document";
    if (file.mimetype.startsWith("image/")) type = "Image";
    else if (file.mimetype.startsWith("audio/")) type = "Audio";

    const media = await Media.create({
      nom: file.originalname,
      url,
      publicId,
      type,
      poids: formaterTaille(file.size),
      tailleOctets: file.size,
      mimetype: file.mimetype,
      uploader: userId,
      date: new Date(),
    });

    return media;
  }

  static async createMediaManuel(data) {
    const media = await Media.create(data);
    return media;
  }

  static async deleteMedia(id) {
    const media = await Media.findById(id);
    if (!media) {
      throw new AppError("Média introuvable", 404);
    }

    if (media.publicId) {
      await deleteFromCloudinary(media.publicId);
    }

    await Media.findByIdAndDelete(id);
    return media;
  }
}
