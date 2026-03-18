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
});

module.exports = Evidence;