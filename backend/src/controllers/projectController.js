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
const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const DRIVE_RECONCILIATION_INTERVAL_MS = 30000;

let lastDriveReconciliationAt = 0;
let driveReconciliationInFlight = null;

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

const isDriveNotFoundError = (err) =>
  err?.code === 404
  || err?.errors?.[0]?.reason === "notFound"
  || err?.response?.status === 404;

const deleteProjectGraph = async (projectId, { deleteFoldersInDrive = true } = {}) => {
  const transaction = await sequelize.transaction();

  try {
    const project = await Project.findByPk(projectId, { transaction });

    if (!project) {
      await transaction.rollback();
      return { deleted: false };
    }

    const teams = await Team.findAll({
      where: { ProjectId: project.id },
      transaction,
    });

    const teamIds = teams.map((team) => team.id);

    if (teamIds.length > 0) {
      await Evidence.destroy({
        where: {
          TeamId: teamIds,
        },
        transaction,
      });

      await Team.destroy({
        where: { id: teamIds },
        transaction,
      });
    }

    const teamFolderIds = teams.map((t) => t.drive_folder_id).filter(Boolean);
    const projectFolderId = project.drive_folder_id;

    await project.destroy({ transaction });
    await transaction.commit();

    if (!deleteFoldersInDrive) {
      return { deleted: true };
    }

    for (const fid of teamFolderIds) {
      try {
        await deleteDriveFolder(fid);
      } catch (e) {
        console.error("[Drive] No se pudo borrar carpeta de equipo", fid, e.message);
      }
    }

    try {
      await deleteDriveFolder(projectFolderId);
    } catch (e) {
      console.error("[Drive] No se pudo borrar carpeta de proyecto", projectFolderId, e.message);
    }

    return { deleted: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const reconcileProjectsDeletedFromDrive = async () => {
  const now = Date.now();
  if (now - lastDriveReconciliationAt < DRIVE_RECONCILIATION_INTERVAL_MS) {
    return;
  }

  if (driveReconciliationInFlight) {
    return driveReconciliationInFlight;
  }

  driveReconciliationInFlight = (async () => {
    try {
      const projectsWithDriveFolder = await Project.findAll({
        attributes: ["id", "drive_folder_id"],
        where: {
          drive_folder_id: {
            [Op.ne]: null,
          },
        },
        raw: true,
      });

      if (projectsWithDriveFolder.length === 0) {
        return;
      }

      let drive;
      try {
        drive = getGoogleDriveClient();
      } catch (error) {
        console.error("[Drive] Reconciliacion omitida por falta de credenciales:", error.message);
        return;
      }

      const staleProjectIds = [];

      for (const project of projectsWithDriveFolder) {
        if (!project.drive_folder_id) continue;

        try {
          const { data } = await drive.files.get({
            fileId: project.drive_folder_id,
            fields: "id, mimeType, trashed",
            supportsAllDrives: true,
          });

          const folderIsMissing = !data?.id;
          const folderIsTrashed = !!data?.trashed;
          const invalidMimeType = data?.mimeType !== DRIVE_FOLDER_MIME_TYPE;

          if (folderIsMissing || folderIsTrashed || invalidMimeType) {
            staleProjectIds.push(project.id);
          }
        } catch (error) {
          if (isDriveNotFoundError(error)) {
            staleProjectIds.push(project.id);
            continue;
          }

          console.error(
            "[Drive] Error validando carpeta de proyecto",
            project.drive_folder_id,
            error.message
          );
        }
      }

      for (const staleProjectId of staleProjectIds) {
        try {
          await deleteProjectGraph(staleProjectId, { deleteFoldersInDrive: false });
          console.log("[Drive] Proyecto removido por carpeta inexistente en Drive:", staleProjectId);
        } catch (error) {
          console.error("[Drive] No se pudo depurar proyecto desincronizado:", staleProjectId, error.message);
        }
      }
    } finally {
      lastDriveReconciliationAt = Date.now();
      driveReconciliationInFlight = null;
    }
  })();

  return driveReconciliationInFlight;
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
    await reconcileProjectsDeletedFromDrive();

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