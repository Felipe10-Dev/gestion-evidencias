const express = require("express");
const router = express.Router();

const { register, login, getUsers, updateUser, deleteUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const loginRateLimiter = require("../middlewares/loginRateLimiter");
const roleMiddleware = require("../middlewares/roleMiddleware");
const validateBody = require("../middlewares/validateBody");
const validateParams = require("../middlewares/validateParams");
const validateQuery = require("../middlewares/validateQuery");
const {
	authLoginSchema,
	authRegisterSchema,
	authUpdateUserSchema,
	emptyQuerySchema,
	userIdParamSchema,
} = require("../validation/bodySchemas");

router.post("/register", authMiddleware, roleMiddleware("admin"), validateQuery(emptyQuerySchema), validateBody(authRegisterSchema), register);
router.post("/login", validateQuery(emptyQuerySchema), validateBody(authLoginSchema), loginRateLimiter, login);
router.get("/users", authMiddleware, roleMiddleware("admin"), validateQuery(emptyQuerySchema), getUsers);
router.put("/users/:id", authMiddleware, roleMiddleware("admin"), validateParams(userIdParamSchema), validateQuery(emptyQuerySchema), validateBody(authUpdateUserSchema), updateUser);
router.delete("/users/:id", authMiddleware, roleMiddleware("admin"), validateParams(userIdParamSchema), validateQuery(emptyQuerySchema), deleteUser);

module.exports = router;