const { Sequelize } = require("sequelize");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
const isProduction = process.env.NODE_ENV === "production";

const pgFallbackByDbKey = {
  DB_HOST: "PGHOST",
  DB_PORT: "PGPORT",
  DB_NAME: "PGDATABASE",
  DB_USER: "PGUSER",
  DB_PASSWORD: "PGPASSWORD",
};

const resolveShouldUseSSL = () => {
  const raw = String(process.env.DB_SSL || "").trim().toLowerCase();

  // Explicit override always wins.
  if (raw === "true") return true;
  if (raw === "false") return false;

  // Default: enable SSL only in production.
  return isProduction;
};

const shouldUseSSL = resolveShouldUseSSL();

const connectionSource = process.env.DATABASE_URL
  ? "DATABASE_URL"
  : process.env.DATABASE_PUBLIC_URL
    ? "DATABASE_PUBLIC_URL"
    : "DB_FIELDS";

const missingDbFields = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"].filter((key) => {
  const pgKey = pgFallbackByDbKey[key];
  return !process.env[key] && !process.env[pgKey];
});

if (!databaseUrl && missingDbFields.length > 0) {
  throw new Error(
    `Configuracion de base de datos incompleta. Falta(n): ${missingDbFields.join(", ")}. Configura DATABASE_URL o todas las variables DB_* necesarias.`
  );
}

const baseOptions = {
  dialect: "postgres",
  logging: false,
  dialectOptions: shouldUseSSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
};

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, baseOptions)
  : new Sequelize(
      process.env.PGDATABASE || process.env.DB_NAME,
      process.env.PGUSER || process.env.DB_USER,
      process.env.PGPASSWORD || process.env.DB_PASSWORD,
      {
        ...baseOptions,
        host: process.env.PGHOST || process.env.DB_HOST,
        port: process.env.PGPORT || process.env.DB_PORT,
      }
    );

const connectDB = async () => {
  try {
    console.log(
      `[DB] Fuente=${connectionSource} SSL=${shouldUseSSL ? "on" : "off"} NODE_ENV=${
        process.env.NODE_ENV || "undefined"
      }`
    );
    await sequelize.authenticate();
    console.log("Conexion a la base de datos exitosa");
  } catch (error) {
    console.error("Error conectando a la base de datos:", error);
    throw error;
  }
};

module.exports = { sequelize, connectDB };