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

export function assertCloudinaryConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      "Cloudinary est requis. Définissez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env",
      503,
    );
  }
}

/**
 * Téléverse une image vers Cloudinary (fichier local, buffer ou data URL).
 */
export async function uploadToCloudinary(source, { folder = "itobe", resourceType = "auto" } = {}) {
  assertCloudinaryConfigured();

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

export async function uploadBufferToCloudinary(
  buffer,
  { folder = "itobe", mimetype = "application/octet-stream", resourceType = "auto" } = {},
) {
  assertCloudinaryConfigured();

  if (!buffer?.length) {
    throw new AppError("Fichier vide", 400);
  }

  const dataUri = `data:${mimetype};base64,${buffer.toString("base64")}`;
  return uploadToCloudinary(dataUri, { folder, resourceType });
}

export async function uploadFileToCloudinary(file, folder = "itobe") {
  if (file?.buffer?.length) {
    return uploadBufferToCloudinary(file.buffer, {
      folder,
      mimetype: file.mimetype || "application/octet-stream",
    });
  }

  if (file?.path) {
    const uploaded = await uploadToCloudinary(file.path, { folder });
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return uploaded;
  }

  throw new AppError("Fichier invalide pour Cloudinary", 400);
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

/** Remplace les images data URL embarquées dans du HTML (éditeur riche). */
export async function resolveCloudinaryHtmlImages(html, folder = "itobe/content") {
  if (typeof html !== "string" || !html.includes("data:")) {
    return html;
  }

  let next = html;
  const matches = [...html.matchAll(/src="(data:[^"]+)"/g)];

  for (const match of matches) {
    const dataUrl = match[1];
    const uploaded = await uploadDataUrlToCloudinary(dataUrl, folder);
    next = next.split(dataUrl).join(uploaded.url);
  }

  return next;
}

/**
 * Remplace les data URLs par des URLs Cloudinary dans les champs média.
 */
export async function resolveCloudinaryMediaFields(
  data,
  {
    coverKey = "couverture",
    galleryKey = "galerie",
    photoKey = "photo",
    htmlKeys = [],
    folder = "itobe",
  } = {},
) {
  const next = { ...data };

  const cover = next[coverKey];
  if (typeof cover === "string" && cover.startsWith("data:")) {
    const uploaded = await uploadDataUrlToCloudinary(cover, `${folder}/covers`);
    next[coverKey] = uploaded.url;
    if ("image" in next) next.image = uploaded.url;
  }

  const photo = next[photoKey];
  if (photoKey && typeof photo === "string" && photo.startsWith("data:")) {
    const uploaded = await uploadDataUrlToCloudinary(photo, `${folder}/photos`);
    next[photoKey] = uploaded.url;
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

  for (const key of htmlKeys) {
    if (typeof next[key] === "string") {
      next[key] = await resolveCloudinaryHtmlImages(next[key], `${folder}/content`);
    }
  }

  return next;
}
