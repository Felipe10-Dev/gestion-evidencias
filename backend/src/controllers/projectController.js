const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { Evidence, Project, Team } = require("../models");
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

const getProjectById = async (req, res) => {
  try {
    if (req.user?.rol === "tecnico" && isWebClientRequest(req)) {
      const allowedProjectIds = await getParticipatingProjectIdsByUser(req.user.id);
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
      try {
        const drive = getGoogleDriveClient();
        await drive.files.update({
          fileId: project.drive_folder_id,
          resource: { name: nombre },
        });
      } catch (driveErr) {
        console.error("[Drive] No se pudo renombrar carpeta del proyecto:", driveErr.message);
      }
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProject = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const project = await Project.findByPk(req.params.id, { transaction });

    if (!project) {
      await transaction.rollback();
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    const teams = await Team.findAll({
      where: { ProjectId: project.id },
      transaction,
    });

    const teamIds = teams.map((team) => team.id);

    if (teamIds.length > 0) {
      await Evidence.update(
        { TeamId: null },
        {
          where: { TeamId: teamIds },
          transaction,
        }
      );

      await Team.destroy({
        where: { id: teamIds },
        transaction,
      });
    }

    // Collect all Drive folder IDs before destroying
    const teamFolderIds = teams.flatMap((t) => [
      t.drive_folder_antes_id,
      t.drive_folder_durante_id,
      t.drive_folder_despues_id,
      t.drive_folder_id,
    ]);
    const projectFolderId = project.drive_folder_id;

    await project.destroy({ transaction });
    await transaction.commit();

    // Delete Drive folders after DB commit (team subfolders first, then project)
    for (const fid of teamFolderIds) {
      try { await deleteDriveFolder(fid); } catch (e) {
        console.error("[Drive] No se pudo borrar carpeta de equipo", fid, e.message);
      }
    }
    try { await deleteDriveFolder(projectFolderId); } catch (e) {
      console.error("[Drive] No se pudo borrar carpeta de proyecto", projectFolderId, e.message);
    }

    res.json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    await transaction.rollback();
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