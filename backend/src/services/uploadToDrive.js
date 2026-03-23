const { Readable } = require("stream");
const getGoogleDriveClient = require("../config/googleDrive");

const uploadToDrive = async (file, options = {}) => {
  if (!file || !file.buffer) {
    throw new Error("Archivo invalido para subir a Google Drive");
  }

  const drive = getGoogleDriveClient();

  const folderId = options.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  const fileMetadata = {
    name: `${Date.now()}-${file.originalname}`,
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType: file.mimetype,
    body: Readable.from(file.buffer),
  };

  const createdFile = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id",
  });

  const fileId = createdFile.data.id;

  await drive.permissions.create({
    fileId,
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
