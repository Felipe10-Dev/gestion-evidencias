const getGoogleDriveClient = require("../config/googleDrive");

/**
 * Creates a folder in Google Drive and returns its ID.
 * @param {string} name - Folder name
 * @param {string|null} parentFolderId - Parent folder ID (null = root Drive)
 * @returns {Promise<string>} - The created folder's ID
 */
const createDriveFolder = async (name, parentFolderId = null) => {
  const drive = getGoogleDriveClient();

  const fileMetadata = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  }

  const folder = await drive.files.create({
    resource: fileMetadata,
    supportsAllDrives: true,
    fields: "id",
  });

  return folder.data.id;
};

module.exports = createDriveFolder;
