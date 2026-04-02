const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { Team, Evidence, Project } = require("../models");
const createDriveFolder = require("../services/createDriveFolder");
const deleteDriveFolder = require("../services/deleteDriveFolder");
const renameDriveItem = require("../services/drive/renameDriveItem");
const deleteTeamGraph = require("../services/teams/deleteTeamGraph");
const {
  getParticipatingProjectIdsByUser,
  isWebClientRequest,
} = require("../utils/projectScope");
const {
  buildPaginationMeta,
  hasPaginationQuery,
  parsePaginationQuery,
} = require("../utils/pagination");
const { buildEmptyPaginatedResponse } = require("../dtos/paginatedResponseDto");

const updateTeam = async (req, res) => {
  try {
    const { nombre } = req.body;
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    await team.update({ nombre });

    if (team.drive_folder_id) {
      await renameDriveItem(team.drive_folder_id, nombre);
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const result = await deleteTeamGraph(req.params.id);
    if (!result.deleted) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    for (const fid of result.folderIds) {
      try { await deleteDriveFolder(fid); } catch (e) {
        console.error("[Drive] No se pudo borrar carpeta", fid, e.message);
      }
    }

    res.json({ message: "Equipo eliminado correctamente" });
  } catch (error) {
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
      const allowedProjectIds = await getParticipatingProjectIdsByUser({
        userId: req.user.id,
        Evidence,
        Team,
        sequelize,
      });
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
      const allowedProjectIds = await getParticipatingProjectIdsByUser({
        userId: req.user.id,
        Evidence,
        Team,
        sequelize,
      });
      if (allowedProjectIds.length === 0) {
        if (!paginationRequested) {
          return res.json([]);
        }

        return res.json(buildEmptyPaginatedResponse({ limit: Number(req.query.limit || 20) }));
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

        return res.json(buildEmptyPaginatedResponse({ limit: Number(req.query.limit || 20) }));
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