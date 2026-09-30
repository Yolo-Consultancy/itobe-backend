const TEAL = "0.059 0.239 0.243";
const MINT = "0.843 0.937 0.910";
const ENCRE = "0.15 0.13 0.13";
const GRIS = "0.45 0.45 0.45";
const LIGNE = "0.96 0.96 0.95";
const BLANC = "1 1 1";

const ACCENTS = {
  é: 233, è: 232, ê: 234, ë: 235, à: 224, â: 226, ä: 228, ù: 249, û: 251, ü: 252,
  ô: 244, ö: 246, î: 238, ï: 239, ç: 231, É: 201, È: 200, Ê: 202, À: 192, Ç: 199,
  "’": 39, "–": 45, "—": 45, "·": 183,
};

const LIBELLES = { toutes: "Toutes catégories", vente: "Ventes", paiement: "Paiements", depense: "Dépenses" };
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function texte(valeur) {
  return String(valeur ?? "")
    .replace(/[\\()]/g, (car) => `\\${car}`)
    .replace(/[^\x20-\x7E]/g, (car) => {
      const code = ACCENTS[car];
      return code ? `\\${code.toString(8).padStart(3, "0")}` : "";
    });
}

function argent(montant) {
  return `${Number(montant).toFixed(2)} $`;
}

function dateLongue(iso) {
  const [annee, mois, jour] = String(iso).split("-");
  const nom = MOIS[Number(mois) - 1] ?? mois;
  return `${Number(jour)} ${nom} ${annee}`;
}

function remplir(r, g, x, y, w, h) {
  return `${r} rg\n${x} ${y} ${w} ${h} re f`;
}

function ecrit(police, taille, couleur, x, y, valeur) {
  return `${couleur} rg\nBT /${police} ${taille} Tf 1 0 0 1 ${x} ${y} Tm (${texte(valeur)}) Tj ET`;
}

function bandeau(rapport, page, totalPages) {
  const titre = LIBELLES[rapport.categorie] ?? rapport.categorie;
  return [
    remplir(TEAL, 0, 760, 595, 82),
    remplir(MINT, 0, 756, 595, 4),
    ecrit("F2", 20, BLANC, 40, 804, "ITOBE"),
    ecrit("F1", 9, MINT, 40, 788, "Comptabilité"),
    ecrit("F2", 13, BLANC, 300, 804, "Rapport financier"),
    ecrit("F1", 9, MINT, 300, 788, titre),
    ecrit("F1", 8, GRIS, 40, 36, `Document généré le ${dateLongue(new Date().toISOString().slice(0, 10))}`),
    ecrit("F1", 8, GRIS, 480, 36, `Page ${page} / ${totalPages}`),
  ];
}

function blocTotal(x, y, label, valeur, accent) {
  return [
    remplir(accent ? TEAL : "0.97 0.97 0.96", x, y, 160, 52),
    ecrit("F1", 8, accent ? MINT : GRIS, x + 12, y + 32, label),
    ecrit("F2", 12, accent ? BLANC : ENCRE, x + 12, y + 12, valeur),
  ].join("\n");
}

function enteteTableau(y) {
  return [
    remplir(TEAL, 40, y - 6, 515, 20),
    ecrit("F2", 8, BLANC, 48, y, "Date"),
    ecrit("F2", 8, BLANC, 120, y, "Référence"),
    ecrit("F2", 8, BLANC, 230, y, "Libellé"),
    ecrit("F2", 8, BLANC, 410, y, "Catégorie"),
    ecrit("F2", 8, BLANC, 490, y, "Montant"),
  ].join("\n");
}

function ligneTableau(ligne, y, alternee) {
  const fond = alternee ? remplir(LIGNE, 40, y - 5, 515, 18) : "";
  const montant = ligne.montant === "" ? "" : argent(ligne.montant);
  return [
    fond,
    ecrit("F1", 8, ENCRE, 48, y, ligne.date),
    ecrit("F1", 8, GRIS, 120, y, String(ligne.reference).slice(0, 16)),
    ecrit("F1", 8, ENCRE, 230, y, String(ligne.libelle).slice(0, 32)),
    ecrit("F1", 8, GRIS, 410, y, ligne.categorie),
    ecrit("F1", 8, ENCRE, 555 - Math.min(String(montant).length, 12) * 4.6, y, montant),
  ].filter(Boolean).join("\n");
}

function pagesDuRapport(rapport) {
  const lignes = rapport.lignes.length
    ? rapport.lignes
    : [{ date: "—", reference: "—", libelle: "Aucun mouvement sur cette période.", categorie: "—", montant: "" }];
  const premiere = 16;
  const suite = 28;
  const pages = [];
  let reste = lignes.slice();
  while (reste.length || pages.length === 0) {
    const quota = pages.length === 0 ? premiere : suite;
    const lot = reste.splice(0, quota);
    pages.push(lot);
    if (reste.length === 0) break;
  }
  return pages.map((lot, index) => {
    const morceaux = [...bandeau(rapport, index + 1, pages.length)];
    let y = 730;
    if (index === 0) {
      morceaux.push(ecrit("F1", 10, GRIS, 40, 730, `Période du ${rapport.debut} au ${rapport.fin}`));
      morceaux.push(blocTotal(40, 660, "VENTES", argent(rapport.totalVentes)));
      morceaux.push(blocTotal(214, 660, "DÉPENSES", argent(rapport.totalDepenses)));
      morceaux.push(blocTotal(388, 660, "TOTAL DE LA PÉRIODE", argent(rapport.total)));
      y = 620;
    }
    morceaux.push(enteteTableau(y));
    y -= 22;
    lot.forEach((ligne, i) => {
      morceaux.push(ligneTableau(ligne, y, i % 2 === 1));
      y -= 18;
    });
    return morceaux.join("\n");
  });
}

export function rapportEnPdf(rapport) {
  const contenus = pagesDuRapport(rapport);
  const objets = [];
  const idCatalogue = 1;
  const idPages = 2;
  const idPolice = 3;
  const idGras = 4;
  let prochain = 5;
  const idsPages = [];
  for (const contenu of contenus) {
    const idContenu = prochain++;
    const idPage = prochain++;
    idsPages.push(idPage);
    objets.push({ id: idContenu, corps: `<< /Length ${Buffer.byteLength(contenu)} >>\nstream\n${contenu}\nendstream` });
    objets.push({
      id: idPage,
      corps: `<< /Type /Page /Parent ${idPages} 0 R /MediaBox [0 0 595 842] /Contents ${idContenu} 0 R /Resources << /Font << /F1 ${idPolice} 0 R /F2 ${idGras} 0 R >> >> >>`,
    });
  }
  objets.unshift(
    { id: idCatalogue, corps: `<< /Type /Catalog /Pages ${idPages} 0 R >>` },
    { id: idPages, corps: `<< /Type /Pages /Kids [${idsPages.map((id) => `${id} 0 R`).join(" ")}] /Count ${idsPages.length} >>` },
    { id: idPolice, corps: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>" },
    { id: idGras, corps: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>" },
  );
  objets.sort((a, b) => a.id - b.id);
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const objet of objets) {
    offsets[objet.id] = Buffer.byteLength(pdf);
    pdf += `${objet.id} 0 obj\n${objet.corps}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objets.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objets.length + 1} /Root ${idCatalogue} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
