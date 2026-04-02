const { listProjectsWithDriveFolder } = require("../../repositories/projectRepository");
const getGoogleDriveClient = require("../../config/googleDrive");
const deleteProjectGraph = require("./deleteProjectGraph");

const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const DRIVE_RECONCILIATION_INTERVAL_MS = 30000;

let lastDriveReconciliationAt = 0;
let driveReconciliationInFlight = null;

const isDriveNotFoundError = (err) =>
  err?.code === 404 || err?.errors?.[0]?.reason === "notFound" || err?.response?.status === 404;

const reconcileProjectsDeletedFromDrive = async () => {
  const now = Date.now();
  if (now - lastDriveReconciliationAt < DRIVE_RECONCILIATION_INTERVAL_MS) {
    return;
  }

  if (driveReconciliationInFlight) {
    return driveReconciliationInFlight;
  }

  driveReconciliationInFlight = (async () => {
    try {
      const projectsWithDriveFolder = await listProjectsWithDriveFolder();

      if (projectsWithDriveFolder.length === 0) {
        return;
      }

      let drive;
      try {
        drive = getGoogleDriveClient();
      } catch (error) {
        console.error("[Drive] Reconciliacion omitida por falta de credenciales:", error.message);
        return;
      }

      const staleProjectIds = [];

      for (const project of projectsWithDriveFolder) {
        if (!project.drive_folder_id) continue;

        try {
          const { data } = await drive.files.get({
            fileId: project.drive_folder_id,
            fields: "id, mimeType, trashed",
            supportsAllDrives: true,
          });

          const folderIsMissing = !data?.id;
          const folderIsTrashed = !!data?.trashed;
          const invalidMimeType = data?.mimeType !== DRIVE_FOLDER_MIME_TYPE;

          if (folderIsMissing || folderIsTrashed || invalidMimeType) {
            staleProjectIds.push(project.id);
          }
        } catch (error) {
          if (isDriveNotFoundError(error)) {
            staleProjectIds.push(project.id);
            continue;
          }

          console.error(
            "[Drive] Error validando carpeta de proyecto",
            project.drive_folder_id,
            error.message
          );
        }
      }

      for (const staleProjectId of staleProjectIds) {
        try {
          await deleteProjectGraph(staleProjectId, { deleteFoldersInDrive: false });
          console.log("[Drive] Proyecto removido por carpeta inexistente en Drive:", staleProjectId);
        } catch (error) {
          console.error(
            "[Drive] No se pudo depurar proyecto desincronizado:",
            staleProjectId,
            error.message
          );
        }
      }
    } finally {
      lastDriveReconciliationAt = Date.now();
      driveReconciliationInFlight = null;
    }
  })();

  return driveReconciliationInFlight;
};

module.exports = reconcileProjectsDeletedFromDrive;
