const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { sequelize } = require("./src/config/database");

const normalizeErrorResponse = require("./src/middlewares/normalizeErrorResponse");
const sqlInjectionGuard = require("./src/middlewares/sqlInjectionGuard");
const evidenceRoutes = require("./src/routes/evidenceRoutes");
const authRoutes = require("./src/routes/authRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const teamRoutes = require("./src/routes/teamRoutes");

const expressApp = express();

const envOrigins = String(process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigins = ["http://localhost:3001", "http://localhost:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3000"];
const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server and curl/Postman requests without Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin no permitido por CORS"));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

expressApp.use(helmet());
expressApp.use(cors(corsOptions));
expressApp.options(/.*/, cors(corsOptions));
expressApp.use(express.json());

// Bloquea patrones tipicos de SQL injection en body/query/params.
expressApp.use(sqlInjectionGuard);

// Estandariza respuestas de error en un solo formato para toda la API.
expressApp.use(normalizeErrorResponse);

expressApp.use("/api/auth", authRoutes);
expressApp.use("/api/projects", projectRoutes);
expressApp.use("/api/teams", teamRoutes);
expressApp.use("/api/evidences", evidenceRoutes);

expressApp.use("/uploads", express.static("uploads"));

expressApp.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

expressApp.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "gestion-evidencias-backend" });
});

expressApp.get("/health/db", async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({ status: "ok", db: "connected" });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      db: "disconnected",
      message: error.message,
      code: error.original?.code || null,
    });
  }
});

module.exports = expressApp;
