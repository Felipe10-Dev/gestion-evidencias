const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Evidence = sequelize.define("Evidence", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  etapa: {
    type: DataTypes.ENUM("antes", "durante", "despues"),
    allowNull: false,
    defaultValue: "durante",
  },

  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "drive_url",
  },

  drive_file_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  drive_folder_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Evidence;