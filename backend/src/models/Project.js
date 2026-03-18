const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Project = sequelize.define("Project", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  descripcion: {
    type: DataTypes.TEXT,
  },

  drive_folder_id: {
    type: DataTypes.STRING,
  },
});

module.exports = Project;