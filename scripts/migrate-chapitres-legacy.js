import mongoose from "mongoose";
import { connectDB } from "../src/config/db.config.js";
import { Livre } from "../src/modules/livres/livre.model.js";
import { Chapitre } from "../src/modules/chapitres/chapitre.model.js";
import { slugify } from "../src/utils/slugify.js";

/**
 * Fonction de migration idempotente des chapitres legacy vers la collection Chapitre.
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} [options.livreId]
 * @param {boolean} [options.log=true]
 * @returns {Promise<{ livresScannes: number, chapitresCrees: number, chapitresIgnores: number, details: Array }>}
 */
export async function migrerChapitresLegacy({ livreId = null, log = true } = {}) {
  const rapport = {
    livresScannes: 0,
    chapitresCrees: 0,
    chapitresIgnores: 0,
    details: [],
  };

  const filtre = livreId ? { _id: livreId } : {};
  const livres = await Livre.find(filtre).lean();
  rapport.livresScannes = livres.length;

  for (const livre of livres) {
    const chapitresLegacy = Array.isArray(livre.chapitres) ? livre.chapitres : [];
    if (chapitresLegacy.length === 0) continue;

    for (let index = 0; index < chapitresLegacy.length; index++) {
      const legacyCap = chapitresLegacy[index];
      const titre = (legacyCap.titre || `Chapitre ${index + 1}`).trim();
      const slug = slugify(titre);
      const ordre = index + 1;

      // Vérifier si le chapitre existe déjà pour ce livre (par titre, slug ou ordre)
      const existant = await Chapitre.findOne({
        livre: livre._id,
        $or: [{ titre }, { slug }, { ordre }],
      });

      if (existant) {
        rapport.chapitresIgnores++;
        rapport.details.push({
          livre: livre.titre,
          chapitre: titre,
          action: "IGNORE_EXISTANT",
          id: existant._id,
        });
      } else {
        const nouveau = await Chapitre.create({
          livre: livre._id,
          titre,
          slug,
          ordre,
          pages: Array.isArray(legacyCap.pages) ? legacyCap.pages : [],
          gratuit: Boolean(legacyCap.gratuit),
          statut: "Publié",
          revision: 1,
          contenu: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: `Contenu initial pour ${titre}.`,
                  },
                ],
              },
            ],
          },
        });

        rapport.chapitresCrees++;
        rapport.details.push({
          livre: livre.titre,
          chapitre: titre,
          action: "CREE",
          id: nouveau._id,
        });
      }
    }
  }

  if (log) {
    console.log("==================================================");
    console.log("📊 Rapport de migration des chapitres legacy :");
    console.log(`- Livres scannés       : ${rapport.livresScannes}`);
    console.log(`- Chapitres créés      : ${rapport.chapitresCrees}`);
    console.log(`- Chapitres déjà prêts : ${rapport.chapitresIgnores}`);
    console.log("==================================================");
  }

  return rapport;
}

// Exécution directe via Node si exécuté en tant que script principal
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("migrate-chapitres-legacy.js")) {
  connectDB()
    .then(() => migrerChapitresLegacy({ log: true }))
    .then(() => {
      console.log("✅ Migration terminée avec succès.");
      return mongoose.connection.close();
    })
    .catch((err) => {
      console.error("❌ Erreur pendant la migration :", err);
      process.exit(1);
    });
}
