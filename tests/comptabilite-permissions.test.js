import assert from "node:assert/strict";
import test from "node:test";
import { aLaPermission, permissionsDuRole } from "../src/modules/comptabilite/permissions.js";

test("le comptable consulte la comptabilité sans gérer les utilisateurs", () => {
  assert.equal(aLaPermission("comptable", "factures.voir"), true);
  assert.equal(aLaPermission("comptable", "paiements.enregistrer"), true);
  assert.equal(aLaPermission("comptable", "depenses.creer"), true);
  assert.equal(aLaPermission("comptable", "caisse.gerer"), true);
  assert.equal(aLaPermission("comptable", "rapports.exporter"), true);
  assert.equal(aLaPermission("comptable", "utilisateurs.gerer"), false);
  assert.equal(aLaPermission("comptable", "roles.gerer"), false);
  assert.equal(aLaPermission("comptable", "parametres.gerer"), false);
  assert.equal(aLaPermission("comptable", "factures.supprimer"), false);
  assert.equal(aLaPermission("comptable", "audit.supprimer"), false);
});

test("l'éditeur et le lecteur n'entrent pas dans la comptabilité", () => {
  assert.equal(aLaPermission("editeur", "factures.voir"), false);
  assert.equal(aLaPermission("lecteur", "caisse.gerer"), false);
});

test("l'administrateur a tous les droits", () => {
  const droits = permissionsDuRole("admin");
  assert.equal(droits["utilisateurs.gerer"], true);
  assert.equal(droits["roles.gerer"], true);
  assert.equal(droits["media.gerer"], true);
  assert.equal(droits["edition.commercial"], true);
  assert.equal(droits["factures.supprimer"], true);
  assert.equal(droits["audit.supprimer"], true);
  assert.ok(Object.values(droits).every((autorise) => autorise === true));
});
