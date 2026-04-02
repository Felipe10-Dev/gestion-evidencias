const { Client } = require("pg");

const getEnv = (key) => (process.env[key] ? String(process.env[key]) : "");

const buildPgConfig = () => {
  // Prefer explicit PG* vars; fallback to DATABASE_URL.
  const databaseUrl = getEnv("DATABASE_URL") || getEnv("DATABASE_PUBLIC_URL");

  if (databaseUrl) {
    return { connectionString: databaseUrl };
  }

  const host = getEnv("PGHOST") || getEnv("DB_HOST");
  const port = Number(getEnv("PGPORT") || getEnv("DB_PORT") || 5432);
  const user = getEnv("PGUSER") || getEnv("DB_USER");
  const password = getEnv("PGPASSWORD") || getEnv("DB_PASSWORD");
  const database = getEnv("PGDATABASE") || getEnv("DB_NAME") || "postgres";

  if (!host || !user || !password || !database) {
    throw new Error(
      "Faltan variables de conexion. Usa DATABASE_URL o define PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE."
    );
  }

  return { host, port, user, password, database };
};

const isSafeDbName = (name) => /^[a-zA-Z0-9_]+$/.test(name);

const quoteIdent = (identifier) => `"${String(identifier).replace(/"/g, '""')}"`;

(async () => {
  const targetDb = String(process.env.DB_TARGET_NAME || "gestion_evidencias").trim();

  if (!targetDb) {
    console.error("DB_TARGET_NAME es requerido");
    process.exit(1);
  }

  if (!isSafeDbName(targetDb)) {
    console.error(
      "Nombre de DB invalido. Usa solo letras, numeros y underscore (ej: gestion_evidencias)."
    );
    process.exit(1);
  }

  const baseConfig = buildPgConfig();

  // To CREATE DATABASE, connect to an existing DB in the same server.
  // If connectionString is used, keep it; otherwise we already have a database.
  const client = new Client(baseConfig);

  try {
    await client.connect();

    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1",
      [targetDb]
    );

    if (exists.rowCount > 0) {
      console.log(`db-create-skip (already-exists): ${targetDb}`);
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdent(targetDb)};`);
    console.log(`db-create-ok: ${targetDb}`);
  } catch (error) {
    console.error("db-create-failed", error);
    process.exit(1);
  } finally {
    await client.end().catch(() => undefined);
  }
})();
