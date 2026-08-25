/** Prix numérique (promo ou prix de base). */
export function prixNumeriqueLivre(livre) {
  return Number(livre.promo ?? livre.prix ?? 0);
}

/** Prix papier : champ dédié ou ancien comportement (prix de base = papier). */
export function prixPapierLivre(livre) {
  const papier = livre.prixPapier;
  if (papier !== null && papier !== undefined && Number(papier) > 0) {
    return Number(papier);
  }
  return prixNumeriqueLivre(livre);
}

/** Prix numérique avec repli legacy (55 % du prix papier si prix papier séparé absent). */
export function prixNumeriqueAffiche(livre) {
  const papier = livre.prixPapier;
  if (papier !== null && papier !== undefined && Number(papier) > 0) {
    return prixNumeriqueLivre(livre);
  }
  return Number((prixNumeriqueLivre(livre) * 0.55).toFixed(2));
}

export function prixLivrePourFormat(livre, format) {
  const fmt = String(format ?? "").toLowerCase();
  if (fmt === "papier") return prixPapierLivre(livre);
  return prixNumeriqueAffiche(livre);
}
