import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/api-error.js";
import { permissionsDuRole } from "./permissions.js";
import { listeClients, rapportPeriode, syntheseArgent } from "./synthese.service.js";
import { rapportEnPdf } from "./rapport-pdf.js";
import { PaiementService } from "../paiements/paiement.service.js";
import { LIBELLES_STATUT, STATUTS_DEPENSE, STATUTS_ENCAISSEMENT, STATUTS_FACTURE, STATUTS_MOUVEMENT } from "./statuts.js";

const router = Router();

router.use(requireAuth);

function refuserHorsComptabilite(req, _res, next) {
  if (req.user?.role !== "admin" && req.user?.role !== "comptable") {
    return next(
      new AppError("Vous n'avez pas les autorisations requises pour effectuer cette action.", 403),
    );
  }
  next();
}

router.use(refuserHorsComptabilite);

router.get("/rapport.pdf", async (req, res, next) => {
  try {
    const data = await rapportPeriode({
      debut: req.query.debut,
      fin: req.query.fin,
      categorie: req.query.categorie || "toutes",
    });
    const fichier = rapportEnPdf(data);
    const nom = `rapport-${data.categorie}-${data.debut}-${data.fin}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nom}"`);
    res.send(fichier);
  } catch (error) {
    next(error);
  }
});

router.get("/rapport", async (req, res, next) => {
  try {
    const data = await rapportPeriode({
      debut: req.query.debut,
      fin: req.query.fin,
      categorie: req.query.categorie || "toutes",
    });
    res.status(200).json({ status: "success", data });
  } catch (error) {
    next(error);
  }
});

router.get("/clients", async (_req, res, next) => {
  try {
    const data = await listeClients();
    res.status(200).json({ status: "success", data });
  } catch (error) {
    next(error);
  }
});

router.get("/paiements", async (req, res, next) => {
  try {
    const { page, limit, statut, moyen, q } = req.query;
    const result = await PaiementService.getAllPaiements({ page, limit, statut, moyen, q });
    res.status(200).json({
      status: "success",
      data: result.paiements,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/synthese", async (_req, res, next) => {
  try {
    const data = await syntheseArgent();
    res.status(200).json({ status: "success", data });
  } catch (error) {
    next(error);
  }
});

router.get("/acces", (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      role: req.user.role,
      permissions: permissionsDuRole(req.user.role),
      statuts: {
        facture: STATUTS_FACTURE,
        depense: STATUTS_DEPENSE,
        encaissement: STATUTS_ENCAISSEMENT,
        mouvement: STATUTS_MOUVEMENT,
        libelles: LIBELLES_STATUT,
      },
    },
  });
});

export const comptabiliteRoutes = router;
