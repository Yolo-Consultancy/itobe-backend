import mongoose from "mongoose";
import { ENV } from "./env.config.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`[MongoDB] Connecté avec succès: ${conn.connection.host} / ${conn.connection.name}`);
    const { UserService } = await import("../modules/users/user.service.js");
    await UserService.ensureComptableParDefaut();
  } catch (error) {
    console.error(`[MongoDB] Erreur de connexion: ${error.message}`);
    process.exit(1);
  }
};
