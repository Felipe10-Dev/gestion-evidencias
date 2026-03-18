const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { Team, Evidence, Project } = require("../models");
const createDriveFolder = require("../services/createDriveFolder");
const deleteDriveFolder = require("../services/deleteDriveFolder");
const getGoogleDriveClient = require("../config/googleDrive");
const {
  buildPaginationMeta,
  hasPaginationQuery,
  parsePaginationQuery,
} = require("../utils/pagination");

const UUID_V4_OR_V1_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isWebClientRequest = (req) => String(req.headers["x-client-app"] || "").toLowerCase() === "web";

const getParticipatingProjectIdsByUser = async (userId) => {
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

const updateTeam = async (req, res) => {
  try {
    const { nombre } = req.body;
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    await team.update({ nombre });

    if (team.drive_folder_id) {
      try {
        const drive = getGoogleDriveClient();
        await drive.files.update({
          fileId: team.drive_folder_id,
          resource: { name: nombre },
        });
      } catch (driveErr) {
        console.error("[Drive] No se pudo renombrar carpeta del equipo:", driveErr.message);
      }
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTeam = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const team = await Team.findByPk(req.params.id, { transaction });

    if (!team) {
      await transaction.rollback();
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    await Evidence.update(
      { TeamId: null },
      { where: { TeamId: team.id }, transaction }
    );

    const folderIds = [
      team.drive_folder_antes_id,
      team.drive_folder_durante_id,
      team.drive_folder_despues_id,
      team.drive_folder_id,
    ];

    await team.destroy({ transaction });
    await transaction.commit();

    for (const fid of folderIds) {
      try { await deleteDriveFolder(fid); } catch (e) {
        console.error("[Drive] No se pudo borrar carpeta", fid, e.message);
      }
    }

    res.json({ message: "Equipo eliminado correctamente" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

const createTeam = async (req, res) => {
  try {
    const { nombre, projectId, ProjectId } = req.body;
    const resolvedProjectId = projectId || ProjectId;

    if (!resolvedProjectId) {
      return res.status(400).json({ error: "projectId es requerido" });
    }

    const team = await Team.create({
      nombre,
      ProjectId: resolvedProjectId,
    });

    try {
      const project = await Project.findByPk(resolvedProjectId);
      const parentFolderId = project && project.drive_folder_id ? project.drive_folder_id : null;

      const teamFolderId = await createDriveFolder(nombre, parentFolderId);

      await team.update({
        drive_folder_id: teamFolderId,
      });
    } catch (driveErr) {
      console.error("[Drive] No se pudo crear carpetas del equipo:", driveErr.message);
    }

    res.status(201).json(team);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }
};

const getTeamById = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    if (req.user?.rol === "tecnico" && isWebClientRequest(req)) {
      const allowedProjectIds = await getParticipatingProjectIdsByUser(req.user.id);
      if (!team.ProjectId || !allowedProjectIds.includes(team.ProjectId)) {
        return res.status(404).json({ error: "Equipo no encontrado" });
      }
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTeams = async (req, res) => {
  try {
    const where = {};
    const paginationRequested = hasPaginationQuery(req.query);

    if (req.user?.rol === "tecnico" && isWebClientRequest(req)) {
      const allowedProjectIds = await getParticipatingProjectIdsByUser(req.user.id);
      if (allowedProjectIds.length === 0) {
        if (!paginationRequested) {
          return res.json([]);
        }

        return res.json({
          data: [],
          meta: buildPaginationMeta({ page: 1, limit: Number(req.query.limit || 20), total: 0 }),
        });
      }

      where.ProjectId = {
        [Op.in]: allowedProjectIds,
      };
    }

    if (req.query.projectId) {
      if (
        req.user?.rol === "tecnico"
        && isWebClientRequest(req)
        && where.ProjectId?.[Op.in]
        && !where.ProjectId[Op.in].includes(req.query.projectId)
      ) {
        if (!paginationRequested) {
          return res.json([]);
        }

        return res.json({
          data: [],
          meta: buildPaginationMeta({ page: 1, limit: Number(req.query.limit || 20), total: 0 }),
        });
      }

      where.ProjectId = req.query.projectId;
    } else if (req.query.unassigned === "true") {
      where.ProjectId = null;
    }

    if (!paginationRequested) {
      const teams = await Team.findAll({ where });
      return res.json(teams);
    }

    const { page, limit, offset, sort, order, search } = parsePaginationQuery(req.query, {
      defaultSort: "createdAt",
      defaultOrder: "DESC",
      allowedSortFields: ["nombre", "createdAt", "updatedAt"],
    });

    if (search) {
      where.nombre = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const { rows, count } = await Team.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sort, order]],
    });

    return res.json({
      data: rows,
      meta: buildPaginationMeta({ page, limit, total: count }),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignTeamToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId, ProjectId } = req.body;
    const resolvedProjectId = projectId || ProjectId;

    if (!resolvedProjectId) {
      return res.status(400).json({ error: "projectId es requerido" });
    }

    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    team.ProjectId = resolvedProjectId;
    await team.save();

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTeam,
  deleteTeam,
  getTeamById,
  getTeams,
  updateTeam,
  assignTeamToProject,
};