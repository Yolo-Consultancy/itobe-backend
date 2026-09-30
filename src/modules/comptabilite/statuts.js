/** Statuts financiers. Les transitions seront appliquées par les services de chaque domaine. */

export const STATUTS_FACTURE = [
  "brouillon",
  "envoyee",
  "partiellement_payee",
  "payee",
  "en_retard",
  "annulee",
];

export const STATUTS_DEPENSE = ["brouillon", "validee", "annulee"];

export const STATUTS_ENCAISSEMENT = ["enregistre", "annule"];

export const STATUTS_MOUVEMENT = ["enregistre", "annule"];

export const LIBELLES_STATUT = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  partiellement_payee: "Partiellement payée",
  payee: "Payée",
  en_retard: "En retard",
  annulee: "Annulée",
  validee: "Validée",
  enregistre: "Enregistré",
  annule: "Annulé",
};
