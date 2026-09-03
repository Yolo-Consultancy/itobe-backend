import { PDFParse } from "pdf-parse";
import { Chapitre } from "../modules/chapitres/chapitre.model.js";
import { slugify } from "./slugify.js";

/**
 * Convertit un texte brut en document JSON TipTap structuré en paragraphes.
 *
 * @param {string} rawText
 * @returns {object} Document JSON compatible TipTap
 */
export function convertTextToTiptapDoc(rawText) {
  if (!rawText || !rawText.trim()) {
    return { type: "doc", content: [] };
  }

  // Découper par doubles retours à la ligne ou lignes non vides
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  const content = paragraphs.map((p) => ({
    type: "paragraph",
    content: [{ type: "text", text: p }],
  }));

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph", content: [{ type: "text", text: rawText.trim() }] }],
  };
}

/**
 * Extrait le texte et les chapitres/pages depuis un buffer PDF et crée/met à jour
 * les enregistrements Chapitre dans MongoDB.
 *
 * @param {Buffer} buffer
 * @param {import("mongoose").Document} livre
 * @returns {Promise<{ numPages: number, chapitresCrees: number }>}
 */
export async function extractAndPopulatePdfChapters(buffer, livre) {
  let fullText = "";
  let numPages = livre.pages || 1;

  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    fullText = (textResult.text || "").trim();
    numPages = textResult.total || numPages;
  } catch (error) {
    console.warn(`[PDF Extractor] Note pour ${livre.slug}:`, error.message);
    return { numPages, chapitresCrees: 0 };
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }

  if (!fullText) {
    return { numPages, chapitresCrees: 0 };
  }

  // Découpage intelligent par sections ou par tranches de pages
  // On regroupe par chapitres (~5 à 10 pages ou par mots-clés "Chapitre", "Partie", "Introduction")
  const rawSections = fullText.split(/(?=\n\s*(?:Chapitre|CHAPITRE|Partie|PARTIE|Section|SECTION|Introduction|Conclusion)\s+[0-9IVXLCDM\s:-]+)/i);

  let chapitresData = [];

  if (rawSections.length > 1) {
    // Découpage basé sur les titres de chapitres détectés dans le PDF
    chapitresData = rawSections
      .map((section, idx) => {
        const lines = section.trim().split("\n").map((l) => l.trim()).filter(Boolean);
        const firstLine = lines[0] || `Chapitre ${idx + 1}`;
        const titre = firstLine.slice(0, 120);
        const resteTexte = lines.slice(1).join("\n\n");
        return {
          titre,
          ordre: idx + 1,
          gratuit: idx === 0, // Le premier chapitre est gratuit en aperçu
          contenu: convertTextToTiptapDoc(resteTexte || section),
        };
      })
      .filter((c) => c.contenu.content.length > 0);
  } else {
    // Si aucun titre explicite, on découpe le texte en blocs réguliers
    const allParas = fullText.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
    const parasPerChapter = Math.max(1, Math.ceil(allParas.length / Math.min(Math.max(1, livre.nombreChapitres || 6), 12)));

    for (let i = 0; i < allParas.length; i += parasPerChapter) {
      const idx = Math.floor(i / parasPerChapter) + 1;
      const slice = allParas.slice(i, i + parasPerChapter).join("\n\n");
      chapitresData.push({
        titre: `Chapitre ${idx}`,
        ordre: idx,
        gratuit: idx === 1,
        contenu: convertTextToTiptapDoc(slice),
      });
    }
  }

  if (chapitresData.length > 0) {
    // Supprimer les anciens chapitres du livre pour éviter les doublons
    await Chapitre.deleteMany({ livre: livre._id });

    // Créer les nouveaux chapitres avec le contenu réel extrait du PDF
    for (const c of chapitresData) {
      await Chapitre.create({
        livre: livre._id,
        titre: c.titre,
        slug: `${livre.slug}-${slugify(c.titre)}-${c.ordre}`,
        ordre: c.ordre,
        statut: "Publié",
        gratuit: c.gratuit,
        contenu: c.contenu,
      });
    }

    console.log(`[PDF Extractor] ${chapitresData.length} chapitres extraits et enregistrés pour ${livre.titre}`);
  }

  return {
    numPages,
    chapitresCrees: chapitresData.length,
  };
}
