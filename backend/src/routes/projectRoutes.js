const express = require("express");
const router = express.Router();

const {
	createProject,
	deleteProject,
	getProjects,
	getProjectById,
	updateProject,
} = require("../controllers/projectController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const validateBody = require("../middlewares/validateBody");
const validateParams = require("../middlewares/validateParams");
const validateQuery = require("../middlewares/validateQuery");
const {
	emptyQuerySchema,
	projectCreateSchema,
	projectIdParamSchema,
	projectListQuerySchema,
	projectUpdateSchema,
} = require("../validation/bodySchemas");

router.post("/", authMiddleware, roleMiddleware("admin"), validateQuery(emptyQuerySchema), validateBody(projectCreateSchema), createProject);

router.get("/", authMiddleware, validateQuery(projectListQuerySchema), getProjects);

router.get("/:id", authMiddleware, validateParams(projectIdParamSchema), validateQuery(emptyQuerySchema), getProjectById);

router.put("/:id", authMiddleware, roleMiddleware("admin"), validateParams(projectIdParamSchema), validateQuery(emptyQuerySchema), validateBody(projectUpdateSchema), updateProject);

router.delete("/:id", authMiddleware, roleMiddleware("admin"), validateParams(projectIdParamSchema), validateQuery(emptyQuerySchema), deleteProject);

module.exports = router;