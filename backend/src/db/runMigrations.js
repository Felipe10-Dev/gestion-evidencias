const { DataTypes } = require("sequelize");

const normalizeTableName = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;

  // Postgres can return { tableName, schema } objects.
  if (typeof value === "object") {
    return value.tableName || value.name || null;
  }

  return null;
};

const resolveTable = async (queryInterface, candidates) => {
  const rawTables = await queryInterface.showAllTables();
  const tables = rawTables
    .map(normalizeTableName)
    .filter(Boolean);

  const byLower = new Map(tables.map((t) => [String(t).toLowerCase(), t]));

  for (const candidate of candidates) {
    const resolved = byLower.get(String(candidate).toLowerCase());
    if (resolved) return resolved;
  }

  return null;
};

const ensureColumn = async (queryInterface, tableName, columnName, definition) => {
  const columns = await queryInterface.describeTable(tableName);

  if (columns[columnName]) {
    return { changed: false };
  }

  await queryInterface.addColumn(tableName, columnName, definition);
  return { changed: true };
};

/**
 * Runs additive-only migrations for schema drift between environments.
 *
 * Goals:
 * - Never drop tables or columns.
 * - Only add missing columns we know the code can use.
 * - Be tolerant to table name casing/pluralization differences.
 */
const runMigrations = async ({ sequelize }) => {
  if (!sequelize) {
    throw new Error("runMigrations requiere sequelize");
  }

  // Allow disabling in rare cases.
  if (process.env.DB_RUN_MIGRATIONS === "false") {
    return;
  }

  const queryInterface = sequelize.getQueryInterface();

  const evidenceTable = await resolveTable(queryInterface, [
    "Evidences",
    "Evidence",
    "evidences",
    "evidence",
  ]);

  const projectTable = await resolveTable(queryInterface, [
    "Projects",
    "Project",
    "projects",
    "project",
  ]);

  const teamTable = await resolveTable(queryInterface, [
    "Teams",
    "Team",
    "teams",
    "team",
  ]);

  const changes = [];

  if (projectTable) {
    changes.push(
      await ensureColumn(queryInterface, projectTable, "drive_folder_id", {
        type: DataTypes.STRING,
        allowNull: true,
      })
    );
  }

  if (teamTable) {
    changes.push(
      await ensureColumn(queryInterface, teamTable, "drive_folder_id", {
        type: DataTypes.STRING,
        allowNull: true,
      })
    );
  }

  if (evidenceTable) {
    // The API expects these columns (with backward-compatible fallbacks in code).
    changes.push(
      await ensureColumn(queryInterface, evidenceTable, "drive_url", {
        type: DataTypes.STRING,
        allowNull: true,
      })
    );

    changes.push(
      await ensureColumn(queryInterface, evidenceTable, "drive_file_id", {
        type: DataTypes.STRING,
        allowNull: true,
      })
    );

    changes.push(
      await ensureColumn(queryInterface, evidenceTable, "drive_folder_id", {
        type: DataTypes.STRING,
        allowNull: true,
      })
    );
  }

  const changedCount = changes.filter((c) => c.changed).length;
  if (changedCount > 0) {
    console.log(`[DB] Migraciones aplicadas: ${changedCount}`);
  }
};

module.exports = runMigrations;
