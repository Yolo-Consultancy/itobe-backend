import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { ENV } from "../src/config/env.config.js";
import { User } from "../src/modules/users/user.model.js";
import { Category } from "../src/modules/categories/category.model.js";
import { Auteur } from "../src/modules/auteurs/auteur.model.js";
import { Livre } from "../src/modules/livres/livre.model.js";
import { Chapitre, extraireTexteTiptap } from "../src/modules/chapitres/chapitre.model.js";
import { VersionChapitre } from "../src/modules/chapitres/version-chapitre.model.js";
import { ChapitreService } from "../src/modules/chapitres/chapitre.service.js";
import { migrerChapitresLegacy } from "../scripts/migrate-chapitres-legacy.js";

describe("📚 Module Chapitres, Versioning Optimiste & Migration Idempotente", () => {
  let adminUser;
  let auteurUser;
  let readerUser;
  let otherAuthorUser;
  let categorie;
  let auteur;
  let livre;

  before(async () => {
    // Connexion MongoDB (utilise MONGODB_URI ou test uri)
    const uri = ENV.MONGODB_URI || "mongodb://127.0.0.1:27017/itobe_test_db";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  after(async () => {
    // Nettoyage final
    await Promise.all([
      Chapitre.deleteMany({}),
      VersionChapitre.deleteMany({}),
      Livre.deleteMany({ titre: /Test Livre/ }),
      Auteur.deleteMany({ nom: /Auteur Test/ }),
      Category.deleteMany({ nom: /Catégorie Test/ }),
      User.deleteMany({ email: /test-chapitre/ }),
    ]);
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Nettoyage avant chaque bloc
    await Promise.all([
      Chapitre.deleteMany({}),
      VersionChapitre.deleteMany({}),
      Livre.deleteMany({ titre: /Test Livre/ }),
      Auteur.deleteMany({ nom: /Auteur Test/ }),
      Category.deleteMany({ nom: /Catégorie Test/ }),
      User.deleteMany({ email: /test-chapitre/ }),
    ]);

    // Création utilisateurs de test
    adminUser = await User.create({
      nom: "Admin",
      prenom: "Test",
      email: "test-chapitre-admin@itobe.cd",
      password: "password123",
      role: "admin",
      portail: "edition",
    });

    auteurUser = await User.create({
      nom: "Auteur",
      prenom: "Principal",
      email: "test-chapitre-auteur@itobe.cd",
      password: "password123",
      role: "lecteur",
      portail: "edition",
    });

    otherAuthorUser = await User.create({
      nom: "Autre",
      prenom: "Auteur",
      email: "test-chapitre-autre@itobe.cd",
      password: "password123",
      role: "lecteur",
      portail: "edition",
    });

    readerUser = await User.create({
      nom: "Lecteur",
      prenom: "Standard",
      email: "test-chapitre-lecteur@itobe.cd",
      password: "password123",
      role: "lecteur",
      portail: "media",
    });

    categorie = await Category.create({
      nom: "Catégorie Test",
      type: "livre",
    });

    auteur = await Auteur.create({
      nom: "Auteur Test",
      user: auteurUser._id,
    });

    livre = await Livre.create({
      titre: "Test Livre 1",
      resume: "Un livre de test",
      pages: 100,
      prix: 10,
      auteur: auteur._id,
      categorie: categorie._id,
      chapitres: [
        { titre: "Chapitre 1 Legacy", pages: [1, 2, 3], gratuit: true },
        { titre: "Chapitre 2 Legacy", pages: [4, 5, 6], gratuit: false },
      ],
    });
  });

  it("1. Devrait extraire correctement le texte et calculer le temps de lecture depuis Tiptap JSON", () => {
    const tiptapJson = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Introduction au récit" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Voici un premier paragraphe avec " },
            { type: "text", marks: [{ type: "bold" }], text: "du texte enrichi." },
          ],
        },
      ],
    };

    const texte = extraireTexteTiptap(tiptapJson);
    assert.ok(texte.includes("Introduction au récit"));
    assert.ok(texte.includes("du texte enrichi."));
  });

  it("2. Devrait créer un chapitre avec révision initiale = 1 et calcul automatique de l'ordre", async () => {
    const chapitre = await ChapitreService.createChapitre(
      livre._id,
      {
        titre: "Nouveau Chapitre 1",
        contenu: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Contenu de test du premier chapitre." }],
            },
          ],
        },
        gratuit: true,
        statut: "Publié",
      },
      adminUser
    );

    assert.ok(chapitre._id);
    assert.equal(chapitre.titre, "Nouveau Chapitre 1");
    assert.equal(chapitre.revision, 1);
    assert.equal(chapitre.ordre, 1);
    assert.equal(chapitre.gratuit, true);
    assert.ok(chapitre.motsCount > 0);
  });

  it("3. Devrait mettre à jour un chapitre et incrémenter la révision", async () => {
    const chapitre = await ChapitreService.createChapitre(
      livre._id,
      {
        titre: "Chapitre à modifier",
        contenu: { type: "doc", content: [] },
      },
      adminUser
    );

    assert.equal(chapitre.revision, 1);

    const misAJour = await ChapitreService.updateChapitre(
      chapitre._id,
      {
        titre: "Chapitre modifié avec succès",
        revision: 1, // Envoi de la révision courante
        contenu: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Nouveau contenu mis à jour." }],
            },
          ],
        },
      },
      adminUser
    );

    assert.equal(misAJour.titre, "Chapitre modifié avec succès");
    assert.equal(misAJour.revision, 2);
  });

  it("4. Devrait REFUSER la modification avec un code 409 en cas de conflit de révision (Optimistic Concurrency)", async () => {
    const chapitre = await ChapitreService.createChapitre(
      livre._id,
      {
        titre: "Chapitre Conflit",
        contenu: { type: "doc", content: [] },
      },
      adminUser
    );

    // Une première mise à jour fait passer la révision à 2
    await ChapitreService.updateChapitre(
      chapitre._id,
      {
        titre: "Modification 1 par Utilisateur A",
        revision: 1,
      },
      adminUser
    );

    // L'utilisateur B essaie de sauvegarder en envoyant l'ancienne révision (1 au lieu de 2)
    await assert.rejects(
      async () => {
        await ChapitreService.updateChapitre(
          chapitre._id,
          {
            titre: "Modification 2 par Utilisateur B en retard",
            revision: 1, // Devrait échouer car la base est à 2
          },
          adminUser
        );
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.ok(err.message.includes("Conflit de révision"));
        assert.equal(err.details?.revisionActuelle, 2);
        assert.equal(err.details?.revisionEnvoyee, 1);
        return true;
      }
    );
  });

  it("5. Devrait appliquer le contrôle des permissions par chapitre et livre", async () => {
    const chapitre = await ChapitreService.createChapitre(
      livre._id,
      {
        titre: "Chapitre Protégé",
        contenu: { type: "doc", content: [] },
      },
      adminUser
    );

    // 1. Un utilisateur non connecté doit être rejeté (401)
    await assert.rejects(
      async () => {
        await ChapitreService.updateChapitre(chapitre._id, { titre: "Hacked" }, null);
      },
      (err) => err.statusCode === 401
    );

    // 2. Un autre auteur ou lecteur non propriétaire doit être rejeté (403)
    await assert.rejects(
      async () => {
        await ChapitreService.updateChapitre(chapitre._id, { titre: "Hacked" }, otherAuthorUser);
      },
      (err) => err.statusCode === 403
    );

    // 3. L'auteur associé au livre doit avoir l'autorisation (200)
    const miseAJourAuteur = await ChapitreService.updateChapitre(
      chapitre._id,
      { titre: "Titre modifié par l'auteur lié", revision: 1 },
      auteurUser
    );
    assert.equal(miseAJourAuteur.titre, "Titre modifié par l'auteur lié");
  });

  it("6. Devrait exécuter une migration 100% IDEMPOTENTE sans doublons", async () => {
    // 1er passage de migration
    const rapport1 = await migrerChapitresLegacy({ livreId: livre._id, log: false });
    assert.equal(rapport1.chapitresCrees, 2);
    assert.equal(rapport1.chapitresIgnores, 0);

    const compteApresP1 = await Chapitre.countDocuments({ livre: livre._id });
    assert.equal(compteApresP1, 2);

    // 2ème passage de migration (doit ignorer et ne rien dupliquer)
    const rapport2 = await migrerChapitresLegacy({ livreId: livre._id, log: false });
    assert.equal(rapport2.chapitresCrees, 0);
    assert.equal(rapport2.chapitresIgnores, 2);

    const compteApresP2 = await Chapitre.countDocuments({ livre: livre._id });
    assert.equal(compteApresP2, 2);

    // Vérification que les données legacy du livre sont restées intactes
    const livreApresMigration = await Livre.findById(livre._id);
    assert.equal(livreApresMigration.chapitres.length, 2);
  });

  it("7. Devrait restreindre le contenu Tiptap des chapitres payants pour les lecteurs non autorisés", async () => {
    // Création d'un chapitre gratuit et d'un chapitre payant
    await ChapitreService.createChapitre(
      livre._id,
      {
        titre: "Extrait Gratuit",
        contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Texte public" }] }] },
        gratuit: true,
        statut: "Publié",
        ordre: 1,
      },
      adminUser
    );

    const payant = await ChapitreService.createChapitre(
      livre._id,
      {
        titre: "Chapitre Secret Payant",
        contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Texte confidentiel" }] }] },
        gratuit: false,
        statut: "Publié",
        ordre: 2,
      },
      adminUser
    );

    // Requête par un lecteur non acheteur
    const listeLecteur = await ChapitreService.getChapitresByLivre(livre._id, readerUser);
    assert.equal(listeLecteur.length, 2);

    const chap1 = listeLecteur.find((c) => c.titre === "Extrait Gratuit");
    const chap2 = listeLecteur.find((c) => c.titre === "Chapitre Secret Payant");

    assert.ok(chap1.contenu, "Le chapitre gratuit doit avoir son contenu visible");
    assert.equal(chap1.verrouille, false);

    assert.equal(chap2.contenu, undefined, "Le contenu du chapitre payant doit être masqué");
    assert.equal(chap2.verrouille, true);

    // Accès direct par ID au chapitre payant sans achat -> 403
    await assert.rejects(
      async () => {
        await ChapitreService.getChapitreById(payant._id, readerUser);
      },
      (err) => err.statusCode === 403
    );
  });

  it("8. Devrait créer des snapshots de versions historiques et permettre la restauration", async () => {
    const chapitre = await ChapitreService.createChapitre(
      livre._id,
      {
        titre: "Version Initiale 1.0",
        contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Contenu original" }] }] },
      },
      adminUser
    );

    // 1. Création d'un snapshot
    const version1 = await ChapitreService.creerVersion(
      chapitre._id,
      { description: "Snapshot v1 avant refonte" },
      adminUser
    );
    assert.ok(version1._id);
    assert.equal(version1.titre, "Version Initiale 1.0");

    // 2. Modification du chapitre
    await ChapitreService.updateChapitre(
      chapitre._id,
      {
        titre: "Version Modifiée 2.0",
        contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Nouveau texte" }] }] },
        revision: 1,
      },
      adminUser
    );

    const listeVersions = await ChapitreService.getVersionsChapitre(chapitre._id, adminUser);
    assert.equal(listeVersions.length, 1);

    // 3. Restauration du snapshot v1
    const restaure = await ChapitreService.restaurerVersion(chapitre._id, version1._id, adminUser);
    assert.equal(restaure.titre, "Version Initiale 1.0");
    assert.equal(restaure.revision, 3); // 1 -> 2 (update) -> 3 (restauration)
  });
});
