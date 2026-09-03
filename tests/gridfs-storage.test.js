import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { uploadFileToGridFS, getFileStreamFromGridFS, deleteFileFromGridFS } from "../src/utils/gridfs.service.js";
import { LivreService } from "../src/modules/livres/livre.service.js";
import { Livre } from "../src/modules/livres/livre.model.js";
import { Auteur } from "../src/modules/auteurs/auteur.model.js";
import { Category } from "../src/modules/categories/category.model.js";
import { BibliothequeService } from "../src/modules/bibliotheque/bibliotheque.service.js";
import { User } from "../src/modules/users/user.model.js";
import { Abonnement } from "../src/modules/abonnements/abonnement.model.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/itobe_test_db";

describe("📦 Stockage de fichiers de livres dans MongoDB GridFS", () => {
  let auteurId;
  let categoryId;
  let testUser;
  let testLivre;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const auteur = await Auteur.create({
      nom: "Auteur Test GridFS",
      slug: "auteur-test-gridfs-" + Date.now(),
      bio: "Bio de test",
    });
    auteurId = auteur._id;

    const cat = await Category.create({
      nom: "Test Category " + Date.now(),
      slug: "test-category-" + Date.now(),
      type: "livre",
    });
    categoryId = cat._id;

    testUser = await User.create({
      nom: "Lecteur Test",
      email: `lecteur-${Date.now()}@test.com`,
      password: "Password123!",
      role: "lecteur",
    });

    testLivre = await Livre.create({
      titre: "Livre Test GridFS " + Date.now(),
      resume: "Résumé de test pour le livre GridFS",
      auteur: auteurId,
      categorie: categoryId,
      pages: 50,
      prix: 15,
      disponible: true,
    });
  });

  after(async () => {
    if (testLivre) await Livre.findByIdAndDelete(testLivre._id);
    if (auteurId) await Auteur.findByIdAndDelete(auteurId);
    if (categoryId) await Category.findByIdAndDelete(categoryId);
    if (testUser) await User.findByIdAndDelete(testUser._id);
    await mongoose.disconnect();
  });

  test("1. Devrait uploader un buffer directement dans GridFS et récupérer son stream", async () => {
    const fakePdfBuffer = Buffer.from("%PDF-1.4 Mock PDF Content For Testing Purpose");
    const uploaded = await uploadFileToGridFS(
      fakePdfBuffer,
      "test-document.pdf",
      "application/pdf",
      { livreId: testLivre._id }
    );

    assert.ok(uploaded.fileId, "L'ID de fichier GridFS doit être généré");
    assert.equal(uploaded.contentType, "application/pdf");

    const retrieved = await getFileStreamFromGridFS(uploaded.fileId);
    assert.ok(retrieved, "Le fichier GridFS doit exister");
    assert.equal(retrieved.file.length, fakePdfBuffer.length);
    assert.equal(retrieved.file.contentType, "application/pdf");

    // Nettoyage
    await deleteFileFromGridFS(uploaded.fileId);
    const afterDelete = await getFileStreamFromGridFS(uploaded.fileId);
    assert.equal(afterDelete, null, "Le fichier doit être supprimé de GridFS");
  });

  test("2. Devrait attacher un fichier PDF via LivreService.uploadFichier et stocker l'ObjectId GridFS", async () => {
    const fakePdfBuffer = Buffer.from("%PDF-1.4 Livre Test Contenu Complet");
    const fakeFile = {
      buffer: fakePdfBuffer,
      mimetype: "application/pdf",
      originalname: "mon-livre.pdf",
      size: fakePdfBuffer.length,
    };

    const livreMisAJour = await LivreService.uploadFichier(testLivre._id, fakeFile, "pdf");

    assert.ok(livreMisAJour.fichiers.pdfFileId, "pdfFileId doit être renseigné");
    assert.ok(
      livreMisAJour.fichiers.pdfUrl.includes(testLivre.slug),
      "pdfUrl doit pointer vers l'endpoint de lecture local"
    );

    // Vérifier dans GridFS
    const gridFile = await getFileStreamFromGridFS(livreMisAJour.fichiers.pdfFileId);
    assert.ok(gridFile, "Le fichier doit être accessible dans le bucket GridFS");
    assert.equal(gridFile.file.length, fakePdfBuffer.length);
  });

  test("3. Devrait diffuser le PDF depuis GridFS pour un utilisateur ayant un abonnement", async () => {
    // Créer un abonnement actif pour le testUser
    await Abonnement.create({
      user: testUser._id,
      statut: "actif",
      type: "mensuel",
      dateDebut: new Date(),
      prochaineEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    let headersSet = {};
    let pipedData = [];
    const mockRes = {
      set: (headers) => {
        headersSet = { ...headersSet, ...headers };
      },
      write: (chunk) => pipedData.push(chunk),
      end: () => {},
      status: () => mockRes,
      on: () => mockRes,
      once: () => mockRes,
      emit: () => true,
    };

    // Appeler diffuserLecture
    await BibliothequeService.diffuserLecture(testUser._id, testLivre.slug, mockRes);

    assert.equal(headersSet["Content-Type"], "application/pdf");
    assert.ok(headersSet["Content-Length"] > 0);
  });

  test("4. Devrait convertir du texte extrait en document JSON TipTap structuré en paragraphes", async () => {
    const { convertTextToTiptapDoc } = await import("../src/utils/pdf-extractor.js");
    const rawSample = "Premier paragraphe du livre extrait du PDF.\n\nDeuxième paragraphe avec plus de détails.";
    const doc = convertTextToTiptapDoc(rawSample);

    assert.equal(doc.type, "doc");
    assert.equal(doc.content.length, 2);
    assert.equal(doc.content[0].type, "paragraph");
    assert.equal(doc.content[0].content[0].text, "Premier paragraphe du livre extrait du PDF.");
  });
});
