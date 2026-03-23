const express = require("express");
const router = express.Router();

const { createTeam, deleteTeam, getTeamById, getTeams, updateTeam, assignTeamToProject } = require("../controllers/teamController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const validateBody = require("../middlewares/validateBody");
const validateParams = require("../middlewares/validateParams");
const validateQuery = require("../middlewares/validateQuery");
const {
	emptyQuerySchema,
	teamAssignProjectSchema,
	teamCreateSchema,
	teamIdParamSchema,
	teamListQuerySchema,
	teamUpdateSchema,
} = require("../validation/bodySchemas");

router.post("/", authMiddleware, roleMiddleware("admin", "tecnico"), validateQuery(emptyQuerySchema), validateBody(teamCreateSchema), createTeam);

router.get("/", authMiddleware, validateQuery(teamListQuerySchema), getTeams);

router.get("/:id", authMiddleware, validateParams(teamIdParamSchema), validateQuery(emptyQuerySchema), getTeamById);

router.put("/:id", authMiddleware, roleMiddleware("admin"), validateParams(teamIdParamSchema), validateQuery(emptyQuerySchema), validateBody(teamUpdateSchema), updateTeam);

router.delete("/:id", authMiddleware, roleMiddleware("admin"), validateParams(teamIdParamSchema), validateQuery(emptyQuerySchema), deleteTeam);

router.put("/:id/assign-project", authMiddleware, roleMiddleware("admin"), validateParams(teamIdParamSchema), validateQuery(emptyQuerySchema), validateBody(teamAssignProjectSchema), assignTeamToProject);

module.exports = router;