const { sequelize } = require("../../config/database");
const { Evidence, Project, Team } = require("../../models");
const deleteDriveFolder = require("../deleteDriveFolder");

const deleteProjectGraph = async (projectId, { deleteFoldersInDrive = true } = {}) => {
  const transaction = await sequelize.transaction();

  try {
    const project = await Project.findByPk(projectId, { transaction });

    if (!project) {
      await transaction.rollback();
      return { deleted: false };
    }

    const teams = await Team.findAll({
      where: { ProjectId: project.id },
      transaction,
    });

    const teamIds = teams.map((team) => team.id);

    if (teamIds.length > 0) {
      await Evidence.destroy({
        where: { TeamId: teamIds },
        transaction,
      });

      await Team.destroy({
        where: { id: teamIds },
        transaction,
      });
    }

    const teamFolderIds = teams.map((t) => t.drive_folder_id).filter(Boolean);
    const projectFolderId = project.drive_folder_id;

    await project.destroy({ transaction });
    await transaction.commit();

    if (!deleteFoldersInDrive) {
      return { deleted: true };
    }

    for (const fid of teamFolderIds) {
      try {
        await deleteDriveFolder(fid);
      } catch (e) {
        console.error("[Drive] No se pudo borrar carpeta de equipo", fid, e.message);
      }
    }

    try {
      await deleteDriveFolder(projectFolderId);
    } catch (e) {
      console.error("[Drive] No se pudo borrar carpeta de proyecto", projectFolderId, e.message);
    }

    return { deleted: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = deleteProjectGraph;
