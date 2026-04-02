const getGoogleDriveClient = require("../../config/googleDrive");

const renameDriveItem = async (fileId, name) => {
  if (!fileId) return false;

  try {
    const drive = getGoogleDriveClient();
    await drive.files.update({
      fileId,
      resource: { name },
      supportsAllDrives: true,
    });
    return true;
  } catch (error) {
    console.error("[Drive] No se pudo renombrar item:", fileId, error.message);
    return false;
  }
};

module.exports = renameDriveItem;
