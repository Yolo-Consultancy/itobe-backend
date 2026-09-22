import { Article } from "../articles/article.model.js";
import { Livre } from "../livres/livre.model.js";
import { User } from "../users/user.model.js";
import { Commande } from "../commandes/commande.model.js";
import { Abonnement } from "../abonnements/abonnement.model.js";
import { VisitorService } from "./visitor.service.js";

export class DashboardService {
  static async getStatistics() {
    const [articleCount, livreCount, userCount, commandeCount, abonnementCount] = await Promise.all([
      Article.countDocuments(),
      Livre.countDocuments(),
      User.countDocuments(),
      Commande.countDocuments(),
      Abonnement.countDocuments(),
    ]);
    return {
      articles: articleCount,
      livres: livreCount,
      users: userCount,
      commandes: commandeCount,
      abonnements: abonnementCount,
    };
  }

  static getVisitorStatistics() {
    return VisitorService.getStatistics();
  }
}
