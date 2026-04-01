/* eslint-disable no-console */
require("dotenv").config();

const getGoogleDriveClient = require("../src/config/googleDrive");

const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

const main = async () => {
  const folderId = (process.env.GOOGLE_DRIVE_FOLDER_ID || "").trim();
  if (!folderId) {
    throw new Error("Falta GOOGLE_DRIVE_FOLDER_ID en el entorno");
  }

  const drive = getGoogleDriveClient();

  console.log("Auth mode:", (process.env.GOOGLE_DRIVE_AUTH_MODE || "auto").trim());
  console.log(
    "Service account via env JSON:",
    Boolean(String(process.env.GOOGLE_DRIVE_CREDENTIALS_JSON || "").trim())
  );
  console.log("Folder ID:", folderId);

  // 1) Verify folder is accessible
  const folder = await drive.files.get({
    fileId: folderId,
    fields: "id,name,driveId,owners(emailAddress),capabilities(canListChildren)",
    supportsAllDrives: true,
  });

  console.log("Folder name:", folder.data.name);
  console.log("Can list children:", folder.data?.capabilities?.canListChildren);

  // 2) List children folders
  const list = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='${DRIVE_FOLDER_MIME_TYPE}' and trashed=false`,
    fields: "files(id,name)",
    orderBy: "name",
    pageSize: 20,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  console.log("Child folders:");
  for (const f of list.data.files || []) {
    console.log("-", f.name, "(", f.id, ")");
  }

  console.log("Total:", (list.data.files || []).length);
};

main().catch((err) => {
  console.error("[testDriveAccess] ERROR:");
  console.error(err?.response?.data || err);
  process.exitCode = 1;
});
