const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Team = sequelize.define("Team", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  drive_folder_id: {
    type: DataTypes.STRING,
  },
});

module.exports = Team;