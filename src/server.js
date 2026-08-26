import app from "./app.js";
import { ENV } from "./config/env.config.js";
import { verifySmtpConnection } from "./utils/email.service.js";

const PORT = ENV.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] 🚀 Écoute sur le port ${PORT} - Mode ${ENV.NODE_ENV}`);
  void verifySmtpConnection();
});
