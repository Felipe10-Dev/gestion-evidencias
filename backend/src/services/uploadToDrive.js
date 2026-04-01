const { Readable } = require("stream");
const getGoogleDriveClient = require("../config/googleDrive");

const isServiceAccountQuotaError = (err) => {
  const message =
    err?.response?.data?.error?.message ||
    err?.errors?.[0]?.message ||
    err?.message ||
    "";

  return String(message).includes("Service Accounts do not have storage quota");
};

const uploadToDrive = async (file, options = {}) => {
  if (!file || !file.buffer) {
    throw new Error("Archivo invalido para subir a Google Drive");
  }

  const drive = getGoogleDriveClient();

  const folderId = options.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Avoid uploading to the service account root (no quota). Always require a parent folder.
  if (!folderId) {
    const missingFolderError = new Error(
      "No hay folderId destino para Drive. Configura GOOGLE_DRIVE_FOLDER_ID o pasa folderId en la solicitud."
    );
    missingFolderError.status = 400;
    throw missingFolderError;
  }

  const fileMetadata = {
    name: `${Date.now()}-${file.originalname}`,
  };

  fileMetadata.parents = [folderId];

  const media = {
    mimeType: file.mimetype,
    body: Readable.from(file.buffer),
  };

  let createdFile;
  try {
    createdFile = await drive.files.create({
      resource: fileMetadata,
      media,
      supportsAllDrives: true,
      fields: "id",
    });
  } catch (err) {
    if (isServiceAccountQuotaError(err)) {
      const quotaError = new Error(
        "La cuenta de servicio no tiene cuota en Drive para subir archivos en 'Mi unidad'. Solucion: usa una Unidad compartida (Shared Drive) como carpeta raiz (GOOGLE_DRIVE_FOLDER_ID) o usa OAuth con delegacion."
      );
      quotaError.status = 422;
      throw quotaError;
    }

    throw err;
  }

  const fileId = createdFile.data.id;

  await drive.permissions.create({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    fileId,
    fileUrl: `https://drive.google.com/uc?id=${fileId}`,
  };
};

module.exports = uploadToDrive;
