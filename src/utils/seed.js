import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.config.js";
import { User } from "../modules/users/user.model.js";
import { Category } from "../modules/categories/category.model.js";
import { Auteur } from "../modules/auteurs/auteur.model.js";
import { Article } from "../modules/articles/article.model.js";
import { Livre } from "../modules/livres/livre.model.js";

async function seed() {
  console.log("[Seed] ⏳ Connexion à la base de données...");
  await connectDB();

  console.log("[Seed] 🧹 Nettoyage des anciennes données...");
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Auteur.deleteMany({}),
    Article.deleteMany({}),
    Livre.deleteMany({}),
  ]);

  console.log("[Seed] 👤 Création des utilisateurs...");
  const [adminUser, editeurUser, lecteurUser] = await User.create([
    {
      nom: "Kakesa",
      prenom: "Espoir",
      email: "admin@itobe.cd",
      password: "admin123",
      role: "admin",
      statut: "Actif",
    },
    {
      nom: "Bigo's",
      prenom: "Christopher",
      email: "editeur@itobe.cd",
      password: "editeur123",
      role: "editeur",
      statut: "Actif",
    },
    {
      nom: "Kabeya",
      prenom: "Nadia",
      email: "lecteur@itobe.cd",
      password: "lecteur123",
      role: "lecteur",
      statut: "Actif",
    },
  ]);

  console.log("[Seed] 📁 Création des catégories...");
  const categoriesMediaList = [
    "Actualités",
    "Culture",
    "Interviews",
    "Chroniques",
    "Économie",
    "Littérature",
  ];
  const categoriesLivresList = [
    "Roman",
    "Essai",
    "Poésie",
    "Jeunesse",
    "Histoire",
    "Développement personnel",
  ];

  const catMediaDocs = await Category.create(
    categoriesMediaList.map((nom) => ({
      nom,
      type: "media",
      description: `Articles de la catégorie ${nom}`,
    }))
  );

  const catLivreDocs = await Category.create(
    categoriesLivresList.map((nom) => ({
      nom,
      type: "livre",
      description: `Ouvrages de la catégorie ${nom}`,
    }))
  );

  console.log("[Seed] ✍️ Création des auteurs...");
  const auteursDocs = await Auteur.create([
    {
      nom: "Christopher Bigo's",
      biographie: "Écrivain, essayiste et éditeur basé à Kinshasa. Passionné par les récits urbains et l'histoire congolaise contemporaine.",
      ville: "Kinshasa",
      role: "Écrivain & Essayiste",
      email: "christopher@itobe.cd",
      reseaux: [
        { label: "Twitter / X", url: "https://x.com" },
        { label: "LinkedIn", url: "https://linkedin.com" },
      ],
      user: editeurUser._id,
    },
    {
      nom: "Espoir Kakesa",
      biographie: "Journaliste culturel, critique littéraire et reporter d'investigation.",
      ville: "Kinshasa",
      role: "Journaliste & Auteur",
      email: "espoir@itobe.cd",
      reseaux: [{ label: "Twitter / X", url: "https://x.com" }],
      user: adminUser._id,
    },
    {
      nom: "Marie Lomba",
      biographie: "Économiste et chroniqueuse spécialisée dans les industries créatives africaines.",
      ville: "Lubumbashi",
      role: "Chroniqueuse Éco",
      email: "marie.lomba@itobe.cd",
      reseaux: [{ label: "LinkedIn", url: "https://linkedin.com" }],
    },
    {
      nom: "Patrick Mundele",
      biographie: "Poète et nouvelliste explorant les mémoires d'Afrique centrale.",
      ville: "Goma",
      role: "Poète & Nouvelliste",
      email: "patrick.mundele@itobe.cd",
    },
  ]);

  console.log("[Seed] 📚 Création des livres...");
  await Livre.create([
    {
      titre: "Le Fleuve et la Page",
      sousTitre: "Une traversée littéraire du Congo",
      auteur: auteursDocs[0]._id,
      categorie: catLivreDocs[0]._id, // Roman
      isbn: "978-2-9584712-0-1",
      resume: "Un grand roman choral suivant trois générations d'écrivains, d'imprimeurs et de passeurs de livres le long du fleuve Congo.",
      pages: 248,
      langue: "Français",
      formats: ["PDF", "EPUB", "Papier"],
      prix: 14.5,
      promo: 12.0,
      stock: 45,
      disponible: true,
      aLaUne: true,
      couleur: "linear-gradient(160deg, oklch(0.62 0.15 48), oklch(0.3 0.05 40))",
      chapitres: [
        { titre: "Chapitre 1 — L'aube sur les berges", pages: [1, 2, 3, 4, 5], gratuit: true },
        { titre: "Chapitre 2 — Les premiers manuscrits", pages: [6, 7, 8, 9, 10], gratuit: true },
        { titre: "Chapitre 3 — La mémoire des encres", pages: [11, 12, 13, 14, 15], gratuit: false },
      ],
    },
    {
      titre: "Grammaire du courage",
      sousTitre: "Essai sur l'action collective",
      auteur: auteursDocs[1]._id,
      categorie: catLivreDocs[1]._id, // Essai
      isbn: "978-2-9584712-1-8",
      resume: "Une réflexion stimulante sur les dynamiques citoyennes et la force des initiatives locales face aux mutations de notre époque.",
      pages: 180,
      langue: "Français",
      formats: ["PDF", "EPUB", "Papier"],
      prix: 11.0,
      stock: 30,
      disponible: true,
      aLaUne: true,
      couleur: "linear-gradient(160deg, oklch(0.72 0.14 78), oklch(0.42 0.08 60))",
      chapitres: [
        { titre: "Introduction — L'urgence de dire", pages: [1, 2, 3], gratuit: true },
        { titre: "Chapitre 1 — Les racines de l'audace", pages: [4, 5, 6, 7], gratuit: false },
      ],
    },
    {
      titre: "Le cartable de Kimia",
      sousTitre: "Contes et découvertes de Kinshasa",
      auteur: auteursDocs[2]._id,
      categorie: catLivreDocs[3]._id, // Jeunesse
      isbn: "978-2-9584712-2-5",
      resume: "Une histoire illustrée pleine de tendresse pour accompagner les plus jeunes dans leur découverte de la ville et de la lecture.",
      pages: 64,
      langue: "Français",
      formats: ["PDF", "Papier"],
      prix: 8.5,
      stock: 120,
      disponible: true,
      couleur: "linear-gradient(160deg, oklch(0.68 0.16 140), oklch(0.35 0.07 150))",
      chapitres: [
        { titre: "1. Le matin du départ", pages: [1, 2, 3, 4], gratuit: true },
      ],
    },
  ]);

  console.log("[Seed] 📰 Création des articles...");
  await Article.create([
    {
      titre: "L'édition numérique face à une nouvelle génération de lecteurs",
      chapo: "Entre lecture mobile, aperçus gratuits et abonnements, les maisons d'édition repensent entièrement leur rapport au public.",
      contenu: "À Kinshasa, la scène éditoriale se réinvente. Les maisons d'édition indépendantes multiplient les formats hybrides, entre papier soigné et diffusion numérique, pour rejoindre un lectorat plus jeune et connecté.\n\nLe mouvement n'est pas seulement technologique. Il redéfinit la chaîne du livre : l'auteur devient éditeur de sa propre voix, le lecteur devient prescripteur, et la librairie s'étend jusqu'à l'écran du téléphone.",
      categorie: catMediaDocs[5]._id, // Littérature
      auteur: auteursDocs[0]._id,
      tags: ["édition", "numérique", "lecteurs"],
      statut: "Publié",
      populaire: true,
      imageCover: "linear-gradient(135deg, oklch(0.62 0.15 48), oklch(0.38 0.06 40))",
    },
    {
      titre: "Portrait : les voix montantes de la littérature congolaise",
      chapo: "Six auteurs, six manières d'écrire le présent. Rencontre avec une génération qui publie vite et loin.",
      contenu: "Six auteurs, six manières d'écrire le présent. Rencontre avec une génération qui publie vite et loin.\n\n« Nous ne vendons pas des fichiers, nous transmettons des récits », résume un éditeur rencontré lors du dernier salon. Cette phrase pourrait tenir lieu de manifeste pour toute une génération.",
      categorie: catMediaDocs[2]._id, // Interviews
      auteur: auteursDocs[1]._id,
      tags: ["auteurs", "portrait"],
      statut: "Publié",
      populaire: true,
      imageCover: "linear-gradient(135deg, oklch(0.74 0.13 72), oklch(0.5 0.1 55))",
    },
    {
      titre: "Le mobile money, moteur discret de l'économie culturelle",
      chapo: "Un paiement en trois secondes change la façon dont un livre se vend. Enquête sur une révolution invisible.",
      contenu: "Un paiement en trois secondes change la façon dont un livre se vend. Enquête sur une révolution invisible.\n\nEntre mobile money, abonnements et aperçus gratuits calibrés, les plateformes cherchent le juste équilibre entre accès et rémunération des créateurs.",
      categorie: catMediaDocs[4]._id, // Économie
      auteur: auteursDocs[2]._id,
      tags: ["paiement", "économie"],
      statut: "Publié",
      populaire: false,
      imageCover: "linear-gradient(135deg, oklch(0.45 0.07 180), oklch(0.28 0.04 200))",
    },
  ]);

  console.log("[Seed] ✅ Base de données initialisée avec succès !");
  console.log("--------------------------------------------------");
  console.log("Comptes créés :");
  console.log("1. Admin   : admin@itobe.cd    / admin123");
  console.log("2. Éditeur : editeur@itobe.cd  / editeur123");
  console.log("3. Lecteur : lecteur@itobe.cd  / lecteur123");
  console.log("--------------------------------------------------");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seed] ❌ Erreur lors du seed :", err);
  process.exit(1);
});
