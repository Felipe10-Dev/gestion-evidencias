const { Op } = require("sequelize");

const UUID_V4_OR_V1_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isWebClientRequest = (req) =>
  String(req.headers["x-client-app"] || "").toLowerCase() === "web";

const getParticipatingProjectIdsByUser = async ({ userId, Evidence, Team, sequelize }) => {
  if (!UUID_V4_OR_V1_REGEX.test(String(userId || ""))) {
    return [];
  }

  const rows = await Evidence.findAll({
    attributes: [[sequelize.col("Team.ProjectId"), "ProjectId"]],
    where: {
      UserId: userId,
    },
    include: [
      {
        model: Team,
        attributes: [],
        required: true,
        where: {
          ProjectId: {
            [Op.ne]: null,
          },
        },
      },
    ],
    group: ["Team.ProjectId"],
    raw: true,
  });

  return [...new Set(rows.map((row) => row.ProjectId).filter(Boolean))];
};

module.exports = {
  isWebClientRequest,
  getParticipatingProjectIdsByUser,
};
