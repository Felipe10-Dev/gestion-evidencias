/* eslint-disable no-console */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");

const DEFAULT_REDIRECT_URI = "http://localhost:3000/oauth2callback";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

const ask = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(String(answer || "").trim());
    });
  });

const extractCode = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  // Allow pasting full redirect URL.
  try {
    const url = new URL(raw);
    return url.searchParams.get("code") || "";
  } catch (_) {
    // Allow pasting querystring fragments too.
    const match = raw.match(/(?:^|[?&])code=([^&]+)/);
    if (match?.[1]) return match[1];

    // If user pasted something like: "4/....&scope=..." take the first part.
    return raw.split("&")[0].trim();
  }
};

const main = async () => {
  const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
  const redirectUri = String(process.env.GOOGLE_OAUTH_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim();
  const outputFile = String(process.env.GOOGLE_OAUTH_REFRESH_TOKEN_FILE || ".refresh_token.txt").trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Faltan GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en el entorno (.env)."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_SCOPE],
  });

  console.log("\n1) Abre este link en tu navegador y autoriza:");
  console.log(authUrl);
  console.log("\n2) Al final te redirige a un URL que empieza con:");
  console.log(redirectUri);
  console.log("Copia ese URL completo (o solo el parametro 'code') y pegalo aqui.\n");

  const input = await ask("> Pega el URL completo o el code: ");
  const code = extractCode(input);
  if (!code) {
    throw new Error("No se encontro 'code'.");
  }

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.log("\nNo se recibio refresh_token.");
    console.log("Tips:");
    console.log("- Asegura prompt=consent y access_type=offline (ya esta en el link)." );
    console.log("- Si ya autorizaste antes, revoca acceso y vuelve a intentar.");
    console.log("  https://myaccount.google.com/permissions");
    process.exitCode = 2;
    return;
  }

  const absoluteOutputPath = path.resolve(process.cwd(), outputFile);
  fs.writeFileSync(absoluteOutputPath, `${tokens.refresh_token}\n`, { encoding: "utf8" });

  console.log("\nLISTO.");
  console.log("Refresh token guardado en:");
  console.log(absoluteOutputPath);
  console.log("\nCopia ese valor y ponlo en Railway como GOOGLE_OAUTH_REFRESH_TOKEN (no lo pegues en el chat)." );
  console.log("(Deja GOOGLE_DRIVE_AUTH_MODE=oauth en produccion.)");
};

main().catch((err) => {
  console.error("\n[generateDriveRefreshToken] ERROR:");
  console.error(err?.response?.data || err?.message || err);
  process.exitCode = 1;
});
