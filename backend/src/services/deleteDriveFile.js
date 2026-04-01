const getGoogleDriveClient = require("../config/googleDrive");

/**
 * Deletes a file from Google Drive.
 * Silently ignores 404s (already deleted or never existed).
 * @param {string} fileId - Drive file ID to delete
 */
const deleteDriveFile = async (fileId) => {
  if (!fileId) return;

  const drive = getGoogleDriveClient();

  try {
    await drive.files.delete({ fileId, supportsAllDrives: true });
  } catch (err) {
    if (err.code === 404 || (err.errors && err.errors[0]?.reason === "notFound")) {
      return;
    }
    throw err;
  }
};

module.exports = deleteDriveFile;
