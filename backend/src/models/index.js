const User = require("./User");
const Project = require("./Project");
const Team = require("./Team");
const Evidence = require("./Evidence");

Project.hasMany(Team);
Team.belongsTo(Project);

Team.hasMany(Evidence);
Evidence.belongsTo(Team);

User.hasMany(Evidence);
Evidence.belongsTo(User);

module.exports = {
  User,
  Project,
  Team,
  Evidence,
};