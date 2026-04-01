/* eslint-disable no-console */
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const DEFAULT_REDIRECT_URI = "http://localhost:3000/oauth2callback";

const extractCode = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.searchParams.get("code") || "";
  } catch (_) {
    return raw;
  }
};

const main = async () => {
  const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
  const redirectUri = String(process.env.GOOGLE_OAUTH_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim();

  const outputFile = String(process.env.GOOGLE_OAUTH_REFRESH_TOKEN_FILE || ".refresh_token.txt").trim();
  const codeFile = String(process.env.GOOGLE_OAUTH_CODE_FILE || ".oauth_code.txt").trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Faltan GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en el entorno (.env)."
    );
  }

  const cliArg = process.argv.slice(2).join(" ");

  let codeInput = cliArg;
  if (!codeInput) {
    const codeFilePath = path.resolve(process.cwd(), codeFile);
    if (fs.existsSync(codeFilePath)) {
      codeInput = String(fs.readFileSync(codeFilePath, { encoding: "utf8" }) || "").trim();
    }
  }

  const code = extractCode(codeInput);
  if (!code) {
    throw new Error(
      `Uso: node scripts/exchangeDriveCodeForRefreshToken.js <code|redirect_url>\n\nTip: si no pasas argumento, el script intenta leer ${codeFile} en el directorio actual.`
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.log("No se recibio refresh_token.");
    console.log("- Asegura prompt=consent y access_type=offline.");
    console.log("- Revoca acceso y reintenta: https://myaccount.google.com/permissions");
    process.exitCode = 2;
    return;
  }

  const absoluteOutputPath = path.resolve(process.cwd(), outputFile);
  fs.writeFileSync(absoluteOutputPath, `${tokens.refresh_token}\n`, { encoding: "utf8" });

  console.log("Refresh token guardado en:");
  console.log(absoluteOutputPath);
  console.log("\nImportante: NO lo pegues en el chat. Copialo de ese archivo y ponlo en Railway.");
};

main().catch((err) => {
  console.error("[exchangeDriveCodeForRefreshToken] ERROR:");
  console.error(err?.response?.data || err?.message || err);
  process.exitCode = 1;
});
