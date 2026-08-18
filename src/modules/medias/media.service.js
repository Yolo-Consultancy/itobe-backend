import { Media } from "./media.model.js";
import { AppError } from "../../utils/api-error.js";
import { v2 as cloudinary } from "cloudinary";
import { ENV } from "../../config/env.config.js";
import fs from "fs";

if (ENV.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
  });
}

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

    // Si Cloudinary est configuré, on upload vers Cloudinary
    if (ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY) {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "itobe",
          resource_type: "auto",
        });
        url = uploadResult.secure_url;
        publicId = uploadResult.public_id;
        // Supprimer le fichier local temporaire
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (err) {
        console.error("Erreur upload Cloudinary:", err);
      }
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

    if (media.publicId && ENV.CLOUDINARY_CLOUD_NAME) {
      try {
        await cloudinary.uploader.destroy(media.publicId);
      } catch (err) {
        console.error("Erreur suppression Cloudinary:", err);
      }
    }

    await Media.findByIdAndDelete(id);
    return media;
  }
}
