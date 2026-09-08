import mongoose from "mongoose";
import { connectDB } from "../src/config/db.config.js";
import { Chapitre, extraireTexteTiptap } from "../src/modules/chapitres/chapitre.model.js";
import { Page } from "../src/modules/pages/page.model.js";

/**
 * Migration idempotente : Chapitre.contenu (legacy) → Page éditoriale.
 *
 * Règles :
 * - 1 chapitre sans Page → 1 Page (ordre 1) avec le contenu Tiptap du chapitre
 * - Ne découpe PAS le contenu en plusieurs pages
 * - N'écrase JAMAIS Chapitre.contenu
 * - Relançable sans doublons (vérifie existence de pages pour le chapitre)
 *
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} [options.chapitreId]
 * @param {string|mongoose.Types.ObjectId} [options.livreId]
 * @param {boolean} [options.log=true]
 * @param {boolean} [options.dryRun=false] — simule sans écrire
 */
export async function migrerChapitreContenuVersPages({
  chapitreId = null,
  livreId = null,
  log = true,
  dryRun = false,
} = {}) {
  const rapport = {
    dryRun: Boolean(dryRun),
    chapitresScannes: 0,
    pagesCrees: 0,
    chapitresIgnoresDejaPages: 0,
    chapitresIgnoresSansLivre: 0,
    details: [],
  };

  const filtre = {};
  if (chapitreId) filtre._id = chapitreId;
  if (livreId) filtre.livre = livreId;

  const chapitres = await Chapitre.find(filtre).lean();
  rapport.chapitresScannes = chapitres.length;

  for (const chapitre of chapitres) {
    if (!chapitre.livre) {
      rapport.chapitresIgnoresSansLivre++;
      rapport.details.push({
        chapitreId: String(chapitre._id),
        titre: chapitre.titre,
        action: "IGNORE_SANS_LIVRE",
      });
      continue;
    }

    const pagesExistantes = await Page.countDocuments({ chapitre: chapitre._id });
    if (pagesExistantes > 0) {
      rapport.chapitresIgnoresDejaPages++;
      rapport.details.push({
        chapitreId: String(chapitre._id),
        titre: chapitre.titre,
        action: "IGNORE_DEJA_PAGES",
        pagesExistantes,
      });
      continue;
    }

    const contenu =
      chapitre.contenu && typeof chapitre.contenu === "object"
        ? chapitre.contenu
        : { type: "doc", content: [] };

    const mots = extraireTexteTiptap(contenu).trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(mots / 200));

    const payload = {
      chapitre: chapitre._id,
      livre: chapitre.livre,
      titre: "Page 1",
      ordre: 1,
      contenu,
      revision: 1,
      motsCount: mots,
      tempsLecture: `${minutes} min`,
    };

    if (dryRun) {
      rapport.pagesCrees++;
      rapport.details.push({
        chapitreId: String(chapitre._id),
        titre: chapitre.titre,
        action: "DRY_RUN_CREERA_PAGE",
        motsCount: mots,
      });
      continue;
    }

    const page = await Page.create(payload);
    rapport.pagesCrees++;
    rapport.details.push({
      chapitreId: String(chapitre._id),
      titre: chapitre.titre,
      action: "PAGE_CREEE",
      pageId: String(page._id),
      motsCount: mots,
    });

    if (log) {
      console.log(
        `[migrate:pages] ✓ « ${chapitre.titre} » → Page 1 (${page._id}) — ${mots} mots`,
      );
    }
  }

  return rapport;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const livreArg = args.find((a) => a.startsWith("--livre="));
  const chapitreArg = args.find((a) => a.startsWith("--chapitre="));

  await connectDB();

  console.log(
    `[migrate:pages] Démarrage${dryRun ? " (dry-run)" : ""} — Chapitre.contenu → Page…`,
  );

  const rapport = await migrerChapitreContenuVersPages({
    dryRun,
    livreId: livreArg ? livreArg.split("=")[1] : null,
    chapitreId: chapitreArg ? chapitreArg.split("=")[1] : null,
    log: true,
  });

  console.log("\n=== Rapport migration Pages ===");
  console.log(JSON.stringify({
    dryRun: rapport.dryRun,
    chapitresScannes: rapport.chapitresScannes,
    pagesCrees: rapport.pagesCrees,
    chapitresIgnoresDejaPages: rapport.chapitresIgnoresDejaPages,
    chapitresIgnoresSansLivre: rapport.chapitresIgnoresSansLivre,
  }, null, 2));

  if (rapport.details.length <= 40) {
    console.log("\nDétails :");
    for (const d of rapport.details) {
      console.log(`  - [${d.action}] ${d.titre || d.chapitreId}`);
    }
  } else {
    console.log(`\n(${rapport.details.length} détails — omis pour lisibilité)`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("migrate-chapitre-contenu-to-pages.js") ||
    process.argv[1].includes("migrate-chapitre-contenu-to-pages"));

if (isDirectRun) {
  main().catch((err) => {
    console.error("[migrate:pages] Échec :", err);
    process.exit(1);
  });
}
