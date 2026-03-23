const express = require("express");
const router = express.Router();

const {
	uploadEvidence,
	deleteEvidenceById,
	getTeamSubfolders,
	createTeamSubfolder,
	renameDriveFolderById,
	getEvidences,
	getEvidenceSummaryByProject,
	getDriveFolders,
	getDriveImageCount,
	deleteDriveFolderById,
} = require("../controllers/evidenceController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const upload = require("../config/multer");
const validateBody = require("../middlewares/validateBody");
const validateParams = require("../middlewares/validateParams");
const validateQuery = require("../middlewares/validateQuery");
const {
	driveFolderIdParamSchema,
	emptyQuerySchema,
	evidenceCreateSubfolderSchema,
	evidenceIdParamSchema,
	evidenceListQuerySchema,
	evidenceRenameFolderSchema,
	evidenceTeamIdParamSchema,
	evidenceUploadSchema,
} = require("../validation/bodySchemas");

router.post("/", authMiddleware, validateQuery(emptyQuerySchema), upload.single("archivo"), validateBody(evidenceUploadSchema), uploadEvidence);
router.get("/team/:teamId/subfolders", authMiddleware, validateParams(evidenceTeamIdParamSchema), validateQuery(emptyQuerySchema), getTeamSubfolders);
router.post("/team/:teamId/subfolders", authMiddleware, validateParams(evidenceTeamIdParamSchema), validateQuery(emptyQuerySchema), validateBody(evidenceCreateSubfolderSchema), createTeamSubfolder);
router.patch("/folders/:folderId", authMiddleware, validateParams(driveFolderIdParamSchema), validateQuery(emptyQuerySchema), validateBody(evidenceRenameFolderSchema), renameDriveFolderById);

router.get("/", authMiddleware, validateQuery(evidenceListQuerySchema), getEvidences);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "tecnico"), validateParams(evidenceIdParamSchema), validateQuery(emptyQuerySchema), deleteEvidenceById);
router.get("/summary/projects", authMiddleware, validateQuery(emptyQuerySchema), getEvidenceSummaryByProject);
router.get("/drive-image-count", authMiddleware, validateQuery(emptyQuerySchema), getDriveImageCount);
router.get("/drive-tree", authMiddleware, validateQuery(emptyQuerySchema), getDriveFolders);
router.get("/folders", authMiddleware, validateQuery(emptyQuerySchema), getDriveFolders);
router.delete("/folders/:folderId", authMiddleware, validateParams(driveFolderIdParamSchema), validateQuery(emptyQuerySchema), deleteDriveFolderById);

module.exports = router;