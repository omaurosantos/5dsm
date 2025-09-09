import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "8443", 10),
  jwtSecret: process.env.JWT_SECRET!,
  origin: process.env.ORIGIN || "https://localhost:5173",
  csrfCookieName: process.env.CSRF_COOKIE_NAME || "csrfToken",
  dataEncKeyHex: process.env.DATA_ENC_KEY_HEX!,
  ssl: {
    keyPath: process.env.SSL_KEY_PATH!,
    certPath: process.env.SSL_CERT_PATH!,
  },
};

if (!config.jwtSecret || !config.dataEncKeyHex) {
  throw new Error("JWT_SECRET e DATA_ENC_KEY_HEX são obrigatórios no .env");
}
