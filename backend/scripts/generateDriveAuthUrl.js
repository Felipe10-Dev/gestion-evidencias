/* eslint-disable no-console */
require("dotenv").config();

const { google } = require("googleapis");

const DEFAULT_REDIRECT_URI = "http://localhost:3000/oauth2callback";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

const main = () => {
  const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
  const redirectUri = String(process.env.GOOGLE_OAUTH_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim();

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

  console.log("REDIRECT_URI:");
  console.log(redirectUri);
  console.log("\nAUTH_URL:");
  console.log(authUrl);
  console.log(
    "\nAbre el AUTH_URL, autoriza, y copia el parametro 'code' del redirect."
  );
};

try {
  main();
} catch (err) {
  console.error("[generateDriveAuthUrl] ERROR:");
  console.error(err?.message || err);
  process.exitCode = 1;
}
