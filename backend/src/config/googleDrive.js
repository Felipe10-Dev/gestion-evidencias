const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

const getCredentialsPath = () =>
  path.resolve(
    process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || "google-service-account.json"
  );

const hasOAuthCredentials = () =>
  !!process.env.GOOGLE_OAUTH_CLIENT_ID &&
  !!process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
  !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

const getGoogleDriveClient = () => {
  if (hasOAuthCredentials()) {
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
  }

  const credentialsPath = getCredentialsPath();

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      `No se encontro el archivo de credenciales de Google Drive en: ${credentialsPath}`
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: [DRIVE_SCOPE],
  });

  return google.drive({
    version: "v3",
    auth,
  });
};

module.exports = getGoogleDriveClient;
