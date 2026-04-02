const { sequelize } = require("../../config/database");
const { Evidence, Team } = require("../../models");

const deleteTeamGraph = async (teamId) => {
  const transaction = await sequelize.transaction();

  try {
    const team = await Team.findByPk(teamId, { transaction });

    if (!team) {
      await transaction.rollback();
      return { deleted: false, folderIds: [] };
    }

    await Evidence.destroy({
      where: { TeamId: team.id },
      transaction,
    });

    const folderIds = [team.drive_folder_id].filter(Boolean);

    await team.destroy({ transaction });
    await transaction.commit();

    return { deleted: true, folderIds };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = deleteTeamGraph;
