import { AppError } from "../../utils/api-error.js";

/** L'administrateur est ajouté à chaque droit par le code, pas par ces listes. */
export const ROLES_PLATEFORME = ["admin", "editeur", "comptable", "lecteur"];

export const LIBELLES_PERMISSIONS = {
  "media.gerer": "Admin Média",
  "edition.catalogue": "Édition — catalogue",
  "edition.commercial": "Édition — ventes, coupons et promotions",
  "edition.analytiques": "Édition — rapports et statistiques",
  "edition.visiteurs": "Édition — visiteurs",
  "lecteur.espace": "Espace lecteur",
  "factures.voir": "Factures — consulter",
  "factures.creer": "Factures — créer",
  "factures.annuler": "Factures — annuler",
  "factures.supprimer": "Factures — supprimer",
  "paiements.voir": "Paiements — consulter",
  "paiements.enregistrer": "Paiements — enregistrer",
  "depenses.voir": "Dépenses — consulter",
  "depenses.creer": "Dépenses — créer",
  "depenses.modifier": "Dépenses — modifier",
  "depenses.valider": "Dépenses — valider",
  "depenses.supprimer": "Dépenses — supprimer",
  "caisse.gerer": "Trésorerie",
  "banque.consulter": "Banque",
  "clients.voir": "Clients financiers",
  "fournisseurs.voir": "Fournisseurs",
  "rapports.voir": "Rapports financiers",
  "rapports.exporter": "Export des rapports",
  "audit.voir": "Journal d'audit",
  "audit.supprimer": "Journal d'audit — supprimer",
  "utilisateurs.gerer": "Utilisateurs",
  "roles.gerer": "Rôles et permissions",
  "parametres.gerer": "Paramètres",
};

/**
 * Droits par rôle. Le rôle vient du jeton, jamais du corps de la requête.
 * L'administrateur a tous les droits, même ceux absents de ces listes.
 */
export const PERMISSIONS_COMPTABILITE = {
  "media.gerer": ["admin"],
  "edition.catalogue": ["admin", "editeur"],
  "edition.commercial": ["admin", "editeur"],
  "edition.analytiques": ["admin", "editeur"],
  "edition.visiteurs": ["admin", "editeur"],
  "lecteur.espace": ["lecteur"],
  "factures.voir": ["admin", "comptable"],
  "factures.creer": ["admin", "comptable"],
  "factures.annuler": ["admin", "comptable"],
  "factures.supprimer": [],
  "paiements.voir": ["admin", "comptable"],
  "paiements.enregistrer": ["admin", "comptable"],
  "depenses.voir": ["admin", "comptable"],
  "depenses.creer": ["admin", "comptable"],
  "depenses.modifier": ["admin", "comptable"],
  "depenses.valider": ["admin", "comptable"],
  "depenses.supprimer": [],
  "caisse.gerer": ["admin", "comptable"],
  "banque.consulter": ["admin", "comptable"],
  "clients.voir": ["admin", "comptable"],
  "fournisseurs.voir": ["admin", "comptable"],
  "rapports.voir": ["admin", "comptable"],
  "rapports.exporter": ["admin", "comptable"],
  "audit.voir": ["admin", "comptable"],
  "audit.supprimer": [],
  "utilisateurs.gerer": ["admin", "editeur"],
  "roles.gerer": ["admin", "editeur"],
  "parametres.gerer": ["admin"],
};

export function aLaPermission(role, permission) {
  if (role === "admin") return true;
  const autorises = PERMISSIONS_COMPTABILITE[permission];
  return Array.isArray(autorises) && autorises.includes(role);
}

export function matricePermissions() {
  return Object.keys(PERMISSIONS_COMPTABILITE).map((cle) => ({
    cle,
    libelle: LIBELLES_PERMISSIONS[cle] ?? cle,
    roles: Object.fromEntries(ROLES_PLATEFORME.map((role) => [role, aLaPermission(role, cle)])),
  }));
}

/** Une case vide signifie que l'action n'existe pas pour ce module. */
const ACTIONS = ["creer", "lire", "modifier", "supprimer"];

export const MODULES_DROITS = [
  { espace: "Édition", module: "Livres", creer: "edition.catalogue", lire: "edition.catalogue", modifier: "edition.catalogue", supprimer: "edition.catalogue" },
  { espace: "Édition", module: "Auteurs", creer: "edition.catalogue", lire: "edition.catalogue", modifier: "edition.catalogue", supprimer: "edition.catalogue" },
  { espace: "Édition", module: "Catégories", creer: "edition.catalogue", lire: "edition.catalogue", modifier: "edition.catalogue", supprimer: "edition.catalogue" },
  { espace: "Édition", module: "Calendrier éditorial", creer: "edition.catalogue", lire: "edition.catalogue", modifier: "edition.catalogue", supprimer: null },
  { espace: "Édition", module: "Commandes", creer: null, lire: "edition.commercial", modifier: "edition.commercial", supprimer: null },
  { espace: "Édition", module: "Paiements", creer: "edition.commercial", lire: "edition.commercial", modifier: "edition.commercial", supprimer: null },
  { espace: "Édition", module: "Coupons", creer: "edition.commercial", lire: "edition.commercial", modifier: "edition.commercial", supprimer: "edition.commercial" },
  { espace: "Édition", module: "Promotions", creer: "edition.commercial", lire: "edition.commercial", modifier: "edition.commercial", supprimer: "edition.commercial" },
  { espace: "Édition", module: "Rapports", creer: null, lire: "edition.analytiques", modifier: null, supprimer: null },
  { espace: "Édition", module: "Statistiques", creer: null, lire: "edition.analytiques", modifier: null, supprimer: null },
  { espace: "Édition", module: "Visiteurs", creer: null, lire: "edition.visiteurs", modifier: null, supprimer: null },
  { espace: "Édition", module: "Utilisateurs", creer: "utilisateurs.gerer", lire: "utilisateurs.gerer", modifier: "utilisateurs.gerer", supprimer: "utilisateurs.gerer" },
  { espace: "Édition", module: "Rôles et permissions", creer: null, lire: "roles.gerer", modifier: "roles.gerer", supprimer: null },
  { espace: "Média", module: "Articles et actualités", creer: "media.gerer", lire: "media.gerer", modifier: "media.gerer", supprimer: "media.gerer" },
  { espace: "Média", module: "Médiathèque", creer: "media.gerer", lire: "media.gerer", modifier: "media.gerer", supprimer: "media.gerer" },
  { espace: "Média", module: "Commentaires et newsletter", creer: "media.gerer", lire: "media.gerer", modifier: "media.gerer", supprimer: "media.gerer" },
  { espace: "Comptabilité", module: "Factures", creer: "factures.creer", lire: "factures.voir", modifier: "factures.annuler", supprimer: "factures.supprimer" },
  { espace: "Comptabilité", module: "Paiements", creer: "paiements.enregistrer", lire: "paiements.voir", modifier: null, supprimer: null },
  { espace: "Comptabilité", module: "Dépenses", creer: "depenses.creer", lire: "depenses.voir", modifier: "depenses.modifier", supprimer: "depenses.supprimer" },
  { espace: "Comptabilité", module: "Trésorerie", creer: "caisse.gerer", lire: "caisse.gerer", modifier: "caisse.gerer", supprimer: null },
  { espace: "Comptabilité", module: "Banque", creer: null, lire: "banque.consulter", modifier: null, supprimer: null },
  { espace: "Comptabilité", module: "Clients", creer: null, lire: "clients.voir", modifier: null, supprimer: null },
  { espace: "Comptabilité", module: "Fournisseurs", creer: null, lire: "fournisseurs.voir", modifier: null, supprimer: null },
  { espace: "Comptabilité", module: "Rapports", creer: null, lire: "rapports.voir", modifier: null, supprimer: null },
  { espace: "Comptabilité", module: "Journal d'audit", creer: null, lire: "audit.voir", modifier: null, supprimer: "audit.supprimer" },
];

const overrides = new Map();

function cleCase(espace, module, action, role) {
  return `${espace}|${module}|${action}|${role}`;
}

export async function chargerOverrides() {
  const { Droit } = await import("./droit.model.js");
  const docs = await Droit.find().lean();
  overrides.clear();
  for (const doc of docs) {
    overrides.set(cleCase(doc.espace, doc.module, doc.action, doc.role), doc.autorise);
  }
}

function caseAction(role, permission, espace, module, action) {
  if (!permission) return null;
  if (role === "admin") return true;
  const cle = cleCase(espace, module, action, role);
  if (overrides.has(cle)) return overrides.get(cle);
  return aLaPermission(role, permission);
}

export async function enregistrerCase({ espace, module, action, role, autorise }) {
  if (role === "admin") {
    throw new AppError("Les droits de l'administrateur restent complets.", 400);
  }
  if (!ROLES_PLATEFORME.includes(role) || !ACTIONS.includes(action)) {
    throw new AppError("Droit invalide.", 400);
  }
  const ligne = MODULES_DROITS.find((item) => item.espace === espace && item.module === module);
  if (!ligne || !ligne[action]) {
    throw new AppError("Cette action n'existe pas pour ce module.", 400);
  }
  const { Droit } = await import("./droit.model.js");
  await Droit.findOneAndUpdate(
    { espace, module, action, role },
    { autorise: Boolean(autorise) },
    { upsert: true, new: true },
  );
  overrides.set(cleCase(espace, module, action, role), Boolean(autorise));
}

export function matriceModules() {
  return MODULES_DROITS.map((ligne) => ({
    espace: ligne.espace,
    module: ligne.module,
    actions: Object.fromEntries(
      ACTIONS.map((action) => [
        action,
        Object.fromEntries(
          ROLES_PLATEFORME.map((role) => [role, caseAction(role, ligne[action], ligne.espace, ligne.module, action)]),
        ),
      ]),
    ),
  }));
}

export function permissionsDuRole(role) {
  return Object.fromEntries(
    Object.keys(PERMISSIONS_COMPTABILITE).map((permission) => [
      permission,
      aLaPermission(role, permission),
    ]),
  );
}

export function exigerPermission(permission) {
  return (req, _res, next) => {
    const role = req.user?.role;
    if (!aLaPermission(role, permission)) {
      return next(
        new AppError("Vous n'avez pas les autorisations requises pour effectuer cette action.", 403),
      );
    }
    next();
  };
}
