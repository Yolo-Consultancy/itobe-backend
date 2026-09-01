import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ENV } from "../config/env.config.js";
import { AppError } from "./api-error.js";

if (ENV.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
  });
}

export function isCloudinaryConfigured() {
  return Boolean(ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET);
}

/**
 * Téléverse une image vers Cloudinary (fichier local ou data URL).
 */
export async function uploadToCloudinary(source, { folder = "itobe", resourceType = "auto" } = {}) {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      "Cloudinary n'est pas configuré. Ajoutez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env",
      503,
    );
  }

  try {
    const result = await cloudinary.uploader.upload(source, {
      folder,
      resource_type: resourceType,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Erreur upload Cloudinary:", error);
    throw new AppError("Échec du téléversement Cloudinary", 502);
  }
}

export async function uploadFileToCloudinary(file, folder = "itobe") {
  const uploaded = await uploadToCloudinary(file.path, { folder });

  if (file.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  return uploaded;
}

export async function uploadDataUrlToCloudinary(dataUrl, folder = "itobe") {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    throw new AppError("Format d'image invalide pour Cloudinary", 400);
  }
  return uploadToCloudinary(dataUrl, { folder });
}

export async function deleteFromCloudinary(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Erreur suppression Cloudinary:", error);
  }
}

/** Remplace les data URLs par des URLs Cloudinary dans les champs média. */
export async function resolveCloudinaryMediaFields(data, { coverKey = "couverture", galleryKey = "galerie", folder = "itobe" } = {}) {
  const next = { ...data };

  const cover = next[coverKey];
  if (typeof cover === "string" && cover.startsWith("data:")) {
    const uploaded = await uploadDataUrlToCloudinary(cover, `${folder}/covers`);
    next[coverKey] = uploaded.url;
    if ("image" in next) next.image = uploaded.url;
  }

  if (galleryKey && Array.isArray(next[galleryKey])) {
    next[galleryKey] = await Promise.all(
      next[galleryKey].map(async (item) => {
        if (typeof item === "string" && item.startsWith("data:")) {
          return (await uploadDataUrlToCloudinary(item, `${folder}/galerie`)).url;
        }
        return item;
      }),
    );
  }

  return next;
}
