/**
 * Smoke test workflow : Chapitre → Page 1 auto → CRUD pages → reorder → idempotence migration.
 * Exécution : node tests/pages-workflow.smoke.js
 */
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.config.js";
import { User } from "../src/modules/users/user.model.js";
import { Livre } from "../src/modules/livres/livre.model.js";
import { Chapitre } from "../src/modules/chapitres/chapitre.model.js";
import { Page } from "../src/modules/pages/page.model.js";
import { ChapitreService } from "../src/modules/chapitres/chapitre.service.js";
import { PageService } from "../src/modules/pages/page.service.js";
import { migrerChapitreContenuVersPages } from "../scripts/migrate-chapitre-contenu-to-pages.js";

async function main() {
  await connectDB();

  const admin = await User.findOne({ role: "admin" });
  assert.ok(admin, "Un utilisateur admin est requis");

  const livre = await Livre.findOne();
  assert.ok(livre, "Un livre est requis");

  console.log("1) Création chapitre → Page 1 automatique");
  const chapitre = await ChapitreService.createChapitre(
    String(livre._id),
    {
      titre: `Smoke Pages ${Date.now()}`,
      statut: "Brouillon",
      gratuit: true,
      contenu: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Contenu initial smoke test" }],
          },
        ],
      },
    },
    admin,
  );

  const pagesApresCreate = await Page.find({ chapitre: chapitre._id }).sort({ ordre: 1 });
  assert.equal(pagesApresCreate.length, 1, "Page 1 doit être créée automatiquement");
  assert.equal(pagesApresCreate[0].ordre, 1);
  assert.equal(pagesApresCreate[0].titre, "Page 1");
  assert.ok(
    JSON.stringify(pagesApresCreate[0].contenu).includes("Contenu initial smoke test"),
    "Le contenu initial doit être copié dans Page 1",
  );
  assert.ok(chapitre.contenu, "chapitre.contenu legacy doit rester intact");
  console.log("   OK — Page 1 créée, legacy conservé");

  console.log("2) Création Page 2 + update contenu");
  const page2 = await PageService.createPage(
    String(chapitre._id),
    {
      titre: "Page 2",
      contenu: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Deuxième page" }] },
        ],
      },
    },
    admin,
  );
  assert.equal(page2.ordre, 2);

  const maj = await PageService.updatePage(
    String(page2._id),
    {
      titre: "Page 2 bis",
      contenu: page2.contenu,
      revision: page2.revision,
    },
    admin,
  );
  assert.equal(maj.titre, "Page 2 bis");
  assert.equal(maj.revision, page2.revision + 1);
  console.log("   OK — CRUD page");

  console.log("3) Réordonnancement");
  const liste = await PageService.getPagesByChapitre(String(chapitre._id), admin);
  assert.equal(liste.length, 2);
  const reord = await PageService.reordonnerPages(
    String(chapitre._id),
    [
      { id: liste[0]._id || liste[0].id, ordre: 2 },
      { id: liste[1]._id || liste[1].id, ordre: 1 },
    ],
    admin,
  );
  assert.equal(reord[0].ordre, 1);
  assert.equal(reord[1].ordre, 2);
  console.log("   OK — reorder");

  console.log("4) Migration idempotente (ne doit rien créer)");
  const rapport = await migrerChapitreContenuVersPages({
    chapitreId: chapitre._id,
    log: false,
  });
  assert.equal(rapport.pagesCrees, 0);
  assert.equal(rapport.chapitresIgnoresDejaPages, 1);
  const countFinal = await Page.countDocuments({ chapitre: chapitre._id });
  assert.equal(countFinal, 2, "Pas de doublon après migration");
  console.log("   OK — migration idempotente");

  console.log("5) Nettoyage");
  await ChapitreService.deleteChapitre(String(chapitre._id), admin);
  const pagesRestantes = await Page.countDocuments({ chapitre: chapitre._id });
  assert.equal(pagesRestantes, 0, "Cascade delete des pages");
  console.log("   OK — cascade delete");

  console.log("\n✅ Smoke workflow Pages — tous les contrôles passés");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("\n❌ Smoke workflow Pages échoué :", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
