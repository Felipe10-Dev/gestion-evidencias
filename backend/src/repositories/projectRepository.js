const { Op } = require("sequelize");
const { Project } = require("../models");

const listProjectsWithDriveFolder = async () =>
  Project.findAll({
    attributes: ["id", "drive_folder_id"],
    where: {
      drive_folder_id: {
        [Op.ne]: null,
      },
    },
    raw: true,
  });

module.exports = {
  listProjectsWithDriveFolder,
};
