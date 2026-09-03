import mongoose from "mongoose";
import { Readable } from "node:stream";

const BUCKET_NAME = "livres_fichiers";

/**
 * Récupère l'instance GridFSBucket active sur la connexion Mongoose.
 */
export function getGridFSBucket() {
  if (!mongoose.connection?.db) {
    throw new Error("Connexion MongoDB non initialisée pour GridFS");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET_NAME,
  });
}

/**
 * Téléverse un buffer binaire dans MongoDB GridFS.
 *
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {string} mimetype
 * @param {object} [metadata]
 * @returns {Promise<{ fileId: mongoose.Types.ObjectId, filename: string, contentType: string }>}
 */
export async function uploadFileToGridFS(buffer, filename, mimetype, metadata = {}) {
  const bucket = getGridFSBucket();
  const readableStream = Readable.from(buffer);

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
      metadata: {
        ...metadata,
        uploadedAt: new Date(),
      },
    });

    readableStream
      .pipe(uploadStream)
      .on("error", reject)
      .on("finish", () => {
        resolve({
          fileId: uploadStream.id,
          filename: uploadStream.filename,
          contentType: mimetype,
        });
      });
  });
}

/**
 * Récupère le flux de téléchargement d'un fichier GridFS ainsi que ses métadonnées.
 *
 * @param {string | mongoose.Types.ObjectId} fileId
 * @returns {Promise<{ stream: import("mongodb").GridFSBucketReadStream, file: object } | null>}
 */
export async function getFileStreamFromGridFS(fileId) {
  const bucket = getGridFSBucket();
  const objectId = typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;

  const files = await bucket.find({ _id: objectId }).toArray();
  if (!files || files.length === 0) {
    return null;
  }

  const fileDoc = files[0];
  const downloadStream = bucket.openDownloadStream(objectId);
  return {
    stream: downloadStream,
    file: fileDoc,
  };
}

/**
 * Supprime un fichier de MongoDB GridFS s'il existe.
 *
 * @param {string | mongoose.Types.ObjectId} fileId
 */
export async function deleteFileFromGridFS(fileId) {
  if (!fileId) return;
  try {
    const bucket = getGridFSBucket();
    const objectId = typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;
    await bucket.delete(objectId);
  } catch (error) {
    console.warn(`[GridFS] Impossible de supprimer le fichier ${fileId}:`, error.message);
  }
}
