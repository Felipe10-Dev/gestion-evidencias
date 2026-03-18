const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { Evidence, Team, Project } = require("../models");
const getGoogleDriveClient = require("../config/googleDrive");
const uploadToDrive = require("../services/uploadToDrive");
const deleteDriveFolder = require("../services/deleteDriveFolder");
const {
  buildPaginationMeta,
  hasPaginationQuery,
  parsePaginationQuery,
} = require("../utils/pagination");

const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const PHASE_FOLDER_NAME = {
  antes: "Antes",
  durante: "Durante",
  despues: "Despues",
};

const normalizeFolderName = (name = "") =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const listChildFolders = async (drive, parentId) => {
  const folders = [];
  let pageToken = undefined;

  do {
    const response = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='${DRIVE_FOLDER_MIME_TYPE}' and trashed=false`,
      fields: "nextPageToken, files(id, name, createdTime, modifiedTime)",
      orderBy: "name",
      pageToken,
      pageSize: 100,
    });

    folders.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return folders;
};

const STAGE_FOLDER_FIELD = {
  antes: "drive_folder_antes_id",
  durante: "drive_folder_durante_id",
  despues: "drive_folder_despues_id",
};

const createDriveFolder = async (drive, parentId, name) => {
  const response = await drive.files.create({
    resource: {
      name,
      mimeType: DRIVE_FOLDER_MIME_TYPE,
      parents: [parentId],
    },
    fields: "id, name",
  });

  return response.data;
};

const findChildFolderByNormalizedName = async (drive, parentId, name) => {
  const normalizedTarget = normalizeFolderName(name);
  const folders = await listChildFolders(drive, parentId);
  return folders.find((folder) => normalizeFolderName(folder.name) === normalizedTarget) || null;
};

const ensureChildFolder = async (drive, parentId, name) => {
  const existing = await findChildFolderByNormalizedName(drive, parentId, name);
  if (existing) return existing;
  return createDriveFolder(drive, parentId, name);
};

const ensureStageFoldersInsideParent = async (drive, parentId) => {
  const antes = await ensureChildFolder(drive, parentId, PHASE_FOLDER_NAME.antes);
  const durante = await ensureChildFolder(drive, parentId, PHASE_FOLDER_NAME.durante);
  const despues = await ensureChildFolder(drive, parentId, PHASE_FOLDER_NAME.despues);

  return {
    antes,
    durante,
    despues,
  };
};

const buildAutoDescription = ({ etapa, referencia }) => {
  const phase = PHASE_FOLDER_NAME[etapa] || "Evidencia";
  if (referencia) {
    return `Foto ${phase} - ${referencia}`;
  }
  return `Foto ${phase}`;
};

const getTeamSubfolders = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findByPk(teamId);

    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    if (!team.drive_folder_id) {
      return res.json([]);
    }

    const drive = getGoogleDriveClient();
    const children = await listChildFolders(drive, team.drive_folder_id);
    const subfolders = children
      .filter((folder) => !Object.keys(PHASE_FOLDER_NAME).includes(normalizeFolderName(folder.name)))
      .map((folder) => ({
        id: folder.id,
        name: folder.name,
        driveUrl: `https://drive.google.com/drive/folders/${folder.id}`,
      }));

    return res.json(subfolders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createTeamSubfolder = async (req, res) => {
  try {
    const { teamId } = req.params;
    const nombre = (req.body.nombre || "").trim();

    if (!nombre) {
      return res.status(400).json({ error: "nombre es requerido" });
    }

    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    if (!team.drive_folder_id) {
      return res.status(400).json({ error: "El equipo no tiene carpeta configurada en Drive" });
    }

    const drive = getGoogleDriveClient();
    const parentSubfolder = await ensureChildFolder(drive, team.drive_folder_id, nombre);
    const phases = await ensureStageFoldersInsideParent(drive, parentSubfolder.id);

    return res.status(201).json({
      id: parentSubfolder.id,
      name: parentSubfolder.name,
      driveUrl: `https://drive.google.com/drive/folders/${parentSubfolder.id}`,
      phases: {
        antes: {
          id: phases.antes.id,
          name: phases.antes.name,
          driveUrl: `https://drive.google.com/drive/folders/${phases.antes.id}`,
        },
        durante: {
          id: phases.durante.id,
          name: phases.durante.name,
          driveUrl: `https://drive.google.com/drive/folders/${phases.durante.id}`,
        },
        despues: {
          id: phases.despues.id,
          name: phases.despues.name,
          driveUrl: `https://drive.google.com/drive/folders/${phases.despues.id}`,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const renameDriveFolderById = async (req, res) => {
  try {
    const { folderId } = req.params;
    const nombre = (req.body.nombre || "").trim();

    if (!folderId) {
      return res.status(400).json({ error: "folderId es requerido" });
    }

    if (!nombre) {
      return res.status(400).json({ error: "nombre es requerido" });
    }

    const drive = getGoogleDriveClient();

    await drive.files.update({
      fileId: folderId,
      resource: { name: nombre },
      fields: "id, name",
    });

    return res.json({
      id: folderId,
      name: nombre,
      driveUrl: `https://drive.google.com/drive/folders/${folderId}`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const uploadEvidence = async (req, res) => {
  try {
    const { teamId, descripcion, etapa } = req.body;
    const referencia = (req.body.referencia || req.body.subcarpeta || "").trim();
    if (!req.file) {
      return res.status(400).json({
        message: "Debes adjuntar un archivo en el campo 'archivo'",
      });
    }

    if (!teamId) {
      return res.status(400).json({
        message: "teamId es obligatorio",
      });
    }

    if (!etapa || !STAGE_FOLDER_FIELD[etapa]) {
      return res.status(400).json({
        message: "etapa es obligatoria y debe ser antes, durante o despues",
      });
    }

    if (!referencia) {
      return res.status(400).json({
        message: "Debes seleccionar o crear una referencia dentro del equipo",
      });
    }

    const team = await Team.findByPk(teamId);

    if (!team) {
      return res.status(404).json({
        message: "Equipo no encontrado",
      });
    }

    const drive = getGoogleDriveClient();
    if (!team.drive_folder_id) {
      return res.status(400).json({
        message: "El equipo no tiene carpeta raiz configurada en Drive",
      });
    }

    const parentSubfolder = await ensureChildFolder(drive, team.drive_folder_id, referencia);
    const phases = await ensureStageFoldersInsideParent(drive, parentSubfolder.id);
    const targetFolderId = phases[etapa].id;
    const usedReferenciaName = parentSubfolder.name;

    if (!targetFolderId) {
      return res.status(400).json({
        message: "El equipo no tiene carpeta configurada en Drive",
      });
    }

    const fileUrl = await uploadToDrive(req.file, {
      folderId: targetFolderId,
    });

    const evidence = await Evidence.create({
      descripcion: (descripcion || "").trim() || buildAutoDescription({ etapa, referencia: usedReferenciaName || referencia }),
      etapa,
      fileUrl,
      TeamId: teamId,
      UserId: req.user.id,
    });

    return res.status(201).json({
      message: "Evidencia subida correctamente",
      evidence,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getEvidences = async (req, res) => {
  try {
    const where = {};
    const paginationRequested = hasPaginationQuery(req.query);

    if (req.query.teamId) {
      where.TeamId = req.query.teamId;
    }

    if (req.query.etapa) {
      where.etapa = req.query.etapa;
    }

    if (!paginationRequested) {
      const evidences = await Evidence.findAll({ where });
      return res.json(evidences);
    }

    const { page, limit, offset, sort, order, search } = parsePaginationQuery(req.query, {
      defaultSort: "createdAt",
      defaultOrder: "DESC",
      allowedSortFields: ["descripcion", "etapa", "createdAt", "updatedAt"],
    });

    if (search) {
      where.descripcion = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const { rows, count } = await Evidence.findAndCountAll({
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

const getEvidenceSummaryByProject = async (req, res) => {
  try {
    const projects = await Project.findAll({
      attributes: ["id", "nombre"],
      order: [["nombre", "ASC"]],
    });

    const teams = await Team.findAll({
      attributes: ["id", "ProjectId"],
    });

    const evidences = await Evidence.findAll({
      attributes: ["id", "TeamId"],
      where: {
        TeamId: {
          [Op.ne]: null,
        },
      },
    });

    const teamProjectMap = new Map(teams.map((team) => [team.id, team.ProjectId]));
    const evidencesByProjectId = new Map(projects.map((project) => [project.id, 0]));

    for (const evidence of evidences) {
      const projectId = teamProjectMap.get(evidence.TeamId);
      if (!projectId || !evidencesByProjectId.has(projectId)) continue;
      evidencesByProjectId.set(projectId, evidencesByProjectId.get(projectId) + 1);
    }

    const byProject = projects.map((project) => ({
      projectId: project.id,
      projectName: project.nombre,
      evidences: evidencesByProjectId.get(project.id) || 0,
    }));

    const totalEvidences = byProject.reduce((total, row) => total + row.evidences, 0);

    res.json({
      totalEvidences,
      byProject,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDriveFolders = async (req, res) => {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!rootFolderId) {
      return res.status(400).json({
        error: "Falta configurar GOOGLE_DRIVE_FOLDER_ID para consultar jerarquia en Drive",
      });
    }

    const drive = getGoogleDriveClient();
    const projectFolders = await listChildFolders(drive, rootFolderId);
    const appTeams = await Team.findAll({
      attributes: ["id", "drive_folder_id"],
    });
    const appTeamByDriveFolderId = new Map(
      appTeams
        .filter((team) => team.drive_folder_id)
        .map((team) => [team.drive_folder_id, team.id])
    );

    const projects = await Promise.all(
      projectFolders.map(async (projectFolder) => {
        const teamFolders = await listChildFolders(drive, projectFolder.id);

        const teams = await Promise.all(
          teamFolders.map(async (teamFolder) => {
            const teamFolders = await listChildFolders(drive, teamFolder.id);
            const legacyRootPhases = {
              antes: null,
              durante: null,
              despues: null,
            };
            const referenciaFolders = [];

            for (const teamChildFolder of teamFolders) {
              const normalized = normalizeFolderName(teamChildFolder.name);
              const folderData = {
                id: teamChildFolder.id,
                name: teamChildFolder.name,
                driveUrl: `https://drive.google.com/drive/folders/${teamChildFolder.id}`,
              };

              if (normalized === "antes") {
                legacyRootPhases.antes = folderData;
              } else if (normalized === "durante") {
                legacyRootPhases.durante = folderData;
              } else if (normalized === "despues") {
                legacyRootPhases.despues = folderData;
              } else {
                referenciaFolders.push(folderData);
              }
            }

            const referencias = await Promise.all(
              referenciaFolders.map(async (referenciaFolder) => {
                const referenciaChildren = await listChildFolders(drive, referenciaFolder.id);
                const phases = {
                  antes: null,
                  durante: null,
                  despues: null,
                };

                for (const childFolder of referenciaChildren) {
                  const normalized = normalizeFolderName(childFolder.name);
                  const folderData = {
                    id: childFolder.id,
                    name: childFolder.name,
                    driveUrl: `https://drive.google.com/drive/folders/${childFolder.id}`,
                  };

                  if (normalized === "antes") {
                    phases.antes = folderData;
                  } else if (normalized === "durante") {
                    phases.durante = folderData;
                  } else if (normalized === "despues") {
                    phases.despues = folderData;
                  }
                }

                return {
                  ...referenciaFolder,
                  phases,
                };
              })
            );

            return {
              id: teamFolder.id,
              name: teamFolder.name,
              appTeamId: appTeamByDriveFolderId.get(teamFolder.id) || null,
              driveUrl: `https://drive.google.com/drive/folders/${teamFolder.id}`,
              phases: legacyRootPhases,
              referencias,
            };
          })
        );

        return {
          id: projectFolder.id,
          name: projectFolder.name,
          driveUrl: `https://drive.google.com/drive/folders/${projectFolder.id}`,
          teams,
        };
      })
    );

    res.json({
      rootFolderId,
      projects,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cuenta imágenes en una lista de carpetas en paralelo
const countImagesInFolders = async (drive, folderIds) => {
  const counts = await Promise.all(
    folderIds.map(async (folderId) => {
      let count = 0;
      let pageToken;
      do {
        const response = await drive.files.list({
          q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
          fields: "nextPageToken, files(id)",
          pageSize: 1000,
          pageToken,
        });
        count += (response.data.files || []).length;
        pageToken = response.data.nextPageToken;
      } while (pageToken);
      return count;
    })
  );
  return counts.reduce((a, b) => a + b, 0);
};

const getDriveImageCount = async (req, res) => {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) {
      return res.status(400).json({ error: "Falta configurar GOOGLE_DRIVE_FOLDER_ID" });
    }

    const drive = getGoogleDriveClient();

    // BFS paralelizado: todos los hijos de un nivel se procesan al mismo tiempo
    const allFolderIds = [rootFolderId];
    let currentLevel = [rootFolderId];
    while (currentLevel.length > 0) {
      const nextLevel = (
        await Promise.all(currentLevel.map((id) => listChildFolders(drive, id)))
      ).flat();
      nextLevel.forEach((f) => allFolderIds.push(f.id));
      currentLevel = nextLevel.map((f) => f.id);
    }

    const totalImages = await countImagesInFolders(drive, allFolderIds);

    res.json({ totalImages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDriveFolderById = async (req, res) => {
  try {
    const { folderId } = req.params;

    if (!folderId) {
      return res.status(400).json({ error: "folderId es requerido" });
    }

    await deleteDriveFolder(folderId);

    const transaction = await sequelize.transaction();

    try {
      const matchedProjects = await Project.findAll({
        where: { drive_folder_id: folderId },
        attributes: ["id"],
        transaction,
      });
      const matchedProjectIds = matchedProjects.map((project) => project.id);

      if (matchedProjectIds.length > 0) {
        const projectTeams = await Team.findAll({
          where: {
            ProjectId: {
              [Op.in]: matchedProjectIds,
            },
          },
          attributes: ["id"],
          transaction,
        });
        const projectTeamIds = projectTeams.map((team) => team.id);

        if (projectTeamIds.length > 0) {
          await Evidence.update(
            { TeamId: null },
            {
              where: {
                TeamId: {
                  [Op.in]: projectTeamIds,
                },
              },
              transaction,
            }
          );

          await Team.destroy({
            where: {
              id: {
                [Op.in]: projectTeamIds,
              },
            },
            transaction,
          });
        }

        await Project.destroy({
          where: {
            id: {
              [Op.in]: matchedProjectIds,
            },
          },
          transaction,
        });

        await transaction.commit();

        return res.json({ message: "Carpeta del proyecto eliminada en Drive y proyecto eliminado en la app" });
      }

      const matchedTeams = await Team.findAll({
        where: { drive_folder_id: folderId },
        attributes: ["id"],
        transaction,
      });
      const matchedTeamIds = matchedTeams.map((team) => team.id);

      if (matchedTeamIds.length > 0) {
        await Evidence.update(
          { TeamId: null },
          {
            where: {
              TeamId: {
                [Op.in]: matchedTeamIds,
              },
            },
            transaction,
          }
        );

        await Team.destroy({
          where: {
            id: {
              [Op.in]: matchedTeamIds,
            },
          },
          transaction,
        });

        await transaction.commit();

        return res.json({ message: "Carpeta del equipo eliminada en Drive y equipo eliminado en la app" });
      }

      await Project.update(
        { drive_folder_id: null },
        { where: { drive_folder_id: folderId }, transaction }
      );

      await Team.update(
        { drive_folder_id: null },
        { where: { drive_folder_id: folderId }, transaction }
      );

      await Team.update(
        { drive_folder_antes_id: null },
        { where: { drive_folder_antes_id: folderId }, transaction }
      );

      await Team.update(
        { drive_folder_durante_id: null },
        { where: { drive_folder_durante_id: folderId }, transaction }
      );

      await Team.update(
        { drive_folder_despues_id: null },
        { where: { drive_folder_despues_id: folderId }, transaction }
      );

      await transaction.commit();

      return res.json({ message: "Carpeta eliminada en Drive (y referencias limpiadas en BD si existian)" });
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadEvidence,
  getTeamSubfolders,
  createTeamSubfolder,
  renameDriveFolderById,
  getEvidences,
  getEvidenceSummaryByProject,
  getDriveFolders,
  getDriveImageCount,
  deleteDriveFolderById,
};