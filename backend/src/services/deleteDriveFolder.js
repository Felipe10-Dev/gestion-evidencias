const getGoogleDriveClient = require("../config/googleDrive");

/**
 * Deletes a folder (and all its contents) from Google Drive.
 * Silently ignores 404s (already deleted or never existed).
 * @param {string} folderId - Drive folder ID to delete
 */
const deleteDriveFolder = async (folderId) => {
  if (!folderId) return;

  const drive = getGoogleDriveClient();

  try {
    await drive.files.delete({ fileId: folderId, supportsAllDrives: true });
  } catch (err) {
    if (err.code === 404 || (err.errors && err.errors[0]?.reason === "notFound")) {
      return;
    }
    throw err;
  }
};

module.exports = deleteDriveFolder;
