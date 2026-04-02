const { sequelize, connectDB } = require("../src/config/database");

const normalizeTableName = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.tableName || value.name || null;
  }
  return null;
};

(async () => {
  try {
    await connectDB();
    const qi = sequelize.getQueryInterface();

    const rawTables = await qi.showAllTables();
    const tables = rawTables
      .map(normalizeTableName)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const schema = {};

    for (const table of tables) {
      try {
        const columns = await qi.describeTable(table);
        schema[table] = Object.fromEntries(
          Object.entries(columns).map(([name, meta]) => [
            name,
            {
              type: meta.type,
              allowNull: meta.allowNull,
              defaultValue: meta.defaultValue,
              primaryKey: meta.primaryKey,
            },
          ])
        );
      } catch (error) {
        schema[table] = { error: error.message };
      }
    }

    console.log(JSON.stringify(schema, null, 2));
  } catch (error) {
    const databaseUrl = String(process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || "");
    const message = String(error?.message || "");
    const code = error?.original?.code || error?.code || null;

    if (
      (code === "ENOTFOUND" || /getaddrinfo\s+ENOTFOUND/i.test(message)) &&
      /railway\.internal/i.test(databaseUrl)
    ) {
      console.error(
        "inspect-db-schema-failed: Estas usando un host interno de Railway (railway.internal) desde tu PC. " +
          "Ese hostname solo funciona dentro de Railway. Usa la URL/host publico de Railway (Proxy/Public Host) " +
          "o ejecuta este comando dentro del servicio en Railway."
      );
    } else if (/does not support ssl connections/i.test(message)) {
      console.error(
        "inspect-db-schema-failed: El servidor Postgres no soporta SSL en esta conexion. " +
          "Solucion: exporta DB_SSL=false (o configura DB_SSL=false en el entorno) y vuelve a intentar."
      );
    } else {
      console.error("inspect-db-schema-failed", error);
    }
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch (_) {
      // ignore
    }
  }
})();
