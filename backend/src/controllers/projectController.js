const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { Evidence, Project, Team } = require("../models");
const createDriveFolder = require("../services/createDriveFolder");
const renameDriveItem = require("../services/drive/renameDriveItem");
const deleteProjectGraph = require("../services/projects/deleteProjectGraph");
const reconcileProjectsDeletedFromDrive = require("../services/projects/reconcileProjectsDeletedFromDrive");
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
// deleteProjectGraph and reconcileProjectsDeletedFromDrive live in src/services/projects/**

const getProjectById = async (req, res) => {
  try {
    if (req.user?.rol === "tecnico" && isWebClientRequest(req)) {
      const allowedProjectIds = await getParticipatingProjectIdsByUser({
        userId: req.user.id,
        Evidence,
        Team,
        sequelize,
      });
      if (!allowedProjectIds.includes(req.params.id)) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }
    }

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const project = await Project.create({
      nombre,
      descripcion,
    });

    try {
      const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
      const folderId = await createDriveFolder(nombre, rootFolderId);
      await project.update({ drive_folder_id: folderId });
    } catch (driveErr) {
      console.error("[Drive] No se pudo crear carpeta del proyecto:", driveErr.message);
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjects = async (req, res) => {
  try {
    await reconcileProjectsDeletedFromDrive();

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

      where.id = {
        [Op.in]: allowedProjectIds,
      };
    }

    if (!paginationRequested) {
      const projects = await Project.findAll({ where });
      return res.json(projects);
    }

    const { page, limit, offset, sort, order, search } = parsePaginationQuery(req.query, {
      defaultSort: "createdAt",
      defaultOrder: "DESC",
      allowedSortFields: ["nombre", "createdAt", "updatedAt"],
    });

    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Project.findAndCountAll({
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

const updateProject = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    await project.update({
      nombre,
      descripcion,
    });

    if (project.drive_folder_id) {
      await renameDriveItem(project.drive_folder_id, nombre);
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const result = await deleteProjectGraph(req.params.id);
    if (!result.deleted) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    res.json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProject,
  deleteProject,
  getProjects,
  getProjectById,
  updateProject,
};