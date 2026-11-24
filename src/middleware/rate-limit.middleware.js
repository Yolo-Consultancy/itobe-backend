const seaux = new Map();

/** Limite simple en mémoire, par adresse IP. Suffisant pour un seul processus Node. */
export function limiteRequetes(nom, max, fenetreMs) {
  return (req, res, next) => {
    const maintenant = Date.now();
    const cle = `${nom}:${req.ip || req.socket?.remoteAddress || "inconnu"}`;
    const essais = (seaux.get(cle) || []).filter((instant) => maintenant - instant < fenetreMs);
    if (essais.length >= max) {
      return res.status(429).json({
        success: false,
        message: "Trop de tentatives. Réessayez dans quelques minutes.",
      });
    }
    essais.push(maintenant);
    seaux.set(cle, essais);
    if (seaux.size > 5000) {
      for (const [clef, valeurs] of seaux) {
        if (valeurs.every((instant) => maintenant - instant >= fenetreMs)) seaux.delete(clef);
      }
    }
    next();
  };
}
