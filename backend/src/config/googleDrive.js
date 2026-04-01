const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

const getCredentialsPath = () =>
  path.resolve(
    process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || "google-service-account.json"
  );

const getServiceAccountCredentialsFromEnv = () => {
  const raw = String(process.env.GOOGLE_DRIVE_CREDENTIALS_JSON || "").trim();
  if (!raw) return null;

  // Allow passing as base64 to avoid escaping issues in hosting providers.
  const maybeJson = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  try {
    return JSON.parse(maybeJson);
  } catch (error) {
    throw new Error(
      "GOOGLE_DRIVE_CREDENTIALS_JSON no es un JSON valido (puede ser JSON directo o base64)"
    );
  }
};

const hasOAuthCredentials = () =>
  !!process.env.GOOGLE_OAUTH_CLIENT_ID &&
  !!process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
  !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

const hasServiceAccountCredentials = () =>
  !!String(process.env.GOOGLE_DRIVE_CREDENTIALS_JSON || "").trim() ||
  fs.existsSync(getCredentialsPath());

const getAuthMode = () =>
  (process.env.GOOGLE_DRIVE_AUTH_MODE || "auto").trim().toLowerCase();

const createOAuthDriveClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });

  return google.drive({
    version: "v3",
    auth: oauth2Client,
  });
};

const createServiceAccountDriveClient = () => {
  const credentials = getServiceAccountCredentialsFromEnv();

  const auth = new google.auth.GoogleAuth(
    credentials
      ? { credentials, scopes: [DRIVE_SCOPE] }
      : { keyFile: getCredentialsPath(), scopes: [DRIVE_SCOPE] }
  );

  return google.drive({
    version: "v3",
    auth,
  });
};

const getGoogleDriveClient = () => {
  const authMode = getAuthMode();

  if (!["auto", "oauth", "service_account"].includes(authMode)) {
    throw new Error(
      "GOOGLE_DRIVE_AUTH_MODE invalido. Valores permitidos: auto, oauth, service_account"
    );
  }

  if (authMode === "oauth") {
    if (!hasOAuthCredentials()) {
      throw new Error(
        "GOOGLE_DRIVE_AUTH_MODE=oauth pero faltan GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN"
      );
    }

    return createOAuthDriveClient();
  }

  if (authMode === "service_account") {
    if (!hasServiceAccountCredentials()) {
      throw new Error(
        `GOOGLE_DRIVE_AUTH_MODE=service_account pero no se encontro el archivo: ${getCredentialsPath()}`
      );
    }

    return createServiceAccountDriveClient();
  }

  // auto mode: try OAuth first, then Service Account.
  if (hasOAuthCredentials()) {
    return createOAuthDriveClient();
  }

  if (hasServiceAccountCredentials()) {
    return createServiceAccountDriveClient();
  }

  throw new Error(
    `No hay autenticacion valida para Google Drive. Revisa GOOGLE_DRIVE_AUTH_MODE y credenciales OAuth/Service Account. Ruta esperada para JSON: ${getCredentialsPath()}`
  );
};

module.exports = getGoogleDriveClient;
