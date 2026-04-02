const { sequelize } = require("../src/config/database");

const quoteIdent = (identifier) => `"${String(identifier).replace(/"/g, '""')}"`;

const normalizeTableName = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.tableName || value.name || null;
  return null;
};

const resolveTable = async (queryInterface, candidates) => {
  const rawTables = await queryInterface.showAllTables();
  const tables = rawTables.map(normalizeTableName).filter(Boolean);
  const byLower = new Map(tables.map((t) => [String(t).toLowerCase(), t]));

  for (const candidate of candidates) {
    const resolved = byLower.get(String(candidate).toLowerCase());
    if (resolved) return resolved;
  }

  return null;
};

const getRowCount = async (tableName) => {
  const sql = `SELECT COUNT(*)::int AS count FROM ${quoteIdent(tableName)};`;
  const [rows] = await sequelize.query(sql);
  return rows?.[0]?.count ?? null;
};

const describe = async (queryInterface, tableName) => {
  try {
    return await queryInterface.describeTable(tableName);
  } catch {
    return null;
  }
};

const plannedActions = [];

const plan = (line) => plannedActions.push(line);

const run = async () => {
  const mode = String(process.env.DB_CLEANUP_MODE || "soft").toLowerCase();
  const confirm = process.env.CONFIRM_DB_CLEANUP === "true";
  const force = process.env.DB_CLEANUP_FORCE === "true";
  const expectedDbName = String(process.env.DB_CONFIRM_NAME || "").trim();

  if (!/^(soft|hard)$/.test(mode)) {
    throw new Error("DB_CLEANUP_MODE debe ser 'soft' o 'hard'");
  }

  const qi = sequelize.getQueryInterface();

  // Print identity of the connected database (helps avoid running against the wrong DB).
  const [identRows] = await sequelize.query(
    "SELECT current_database() AS db, inet_server_addr() AS host, inet_server_port() AS port"
  );
  const identity = identRows?.[0] || {};
  console.log(`[DB] Connected db=${identity.db || "?"} host=${identity.host || "?"} port=${identity.port || "?"}`);

  if (confirm && expectedDbName && String(identity.db || "") !== expectedDbName) {
    throw new Error(
      `Seguridad: DB_CONFIRM_NAME='${expectedDbName}' no coincide con current_database()='${identity.db}'. Aborto.`
    );
  }

  const usersTable = await resolveTable(qi, ["Users", "User"]);
  const projectsTable = await resolveTable(qi, ["Projects", "Project"]);
  const teamsTable = await resolveTable(qi, ["Teams", "Team"]);
  const evidenceTable = await resolveTable(qi, ["Evidence", "Evidences"]);

  const tenantsTable = await resolveTable(qi, ["Tenants", "Tenant"]);
  const plansTable = await resolveTable(qi, ["Plans", "Plan"]);
  const planChangesTable = await resolveTable(qi, ["PlanChangeHistories", "PlanChangeHistory"]);

  const coreTables = [
    { label: "Users", name: usersTable },
    { label: "Projects", name: projectsTable },
    { label: "Teams", name: teamsTable },
    { label: "Evidence", name: evidenceTable },
  ].filter((t) => t.name);

  if (!confirm) {
    console.log("[DB] Resolved core tables:", coreTables.map((t) => `${t.label}=>${t.name}`).join(", "));
  }

  const tenantColumns = ["tenantId", "TenantId"];

  const coreTenantFindings = [];

  for (const t of coreTables) {
    const columns = await describe(qi, t.name);
    if (!columns) continue;

    const found = tenantColumns.filter((col) => Boolean(columns[col]));
    coreTenantFindings.push({ table: t.label, resolvedName: t.name, found });

    for (const col of tenantColumns) {
      if (!columns[col]) continue;

      if (mode === "soft") {
        if (columns[col].allowNull === false) {
          plan(`${t.label}: ALTER COLUMN ${col} DROP NOT NULL`);
          if (confirm) {
            await sequelize.query(
              `ALTER TABLE ${quoteIdent(t.name)} ALTER COLUMN ${quoteIdent(col)} DROP NOT NULL;`
            );
          }
        }
      } else {
        plan(`${t.label}: DROP COLUMN ${col} (CASCADE)`);
        if (confirm) {
          await sequelize.query(
            `ALTER TABLE ${quoteIdent(t.name)} DROP COLUMN IF EXISTS ${quoteIdent(col)} CASCADE;`
          );
        }
      }
    }
  }

  const extraTables = [
    { label: "Tenants", name: tenantsTable },
    { label: "Plans", name: plansTable },
    { label: "PlanChangeHistories", name: planChangesTable },
  ].filter((t) => t.name);

  const extraTableCounts = [];

  for (const t of extraTables) {
    const count = await getRowCount(t.name);
    extraTableCounts.push({ table: t.label, resolvedName: t.name, count });

    if (mode === "soft") {
      plan(`${t.label}: mantener (modo soft) (rows=${count ?? "?"})`);
      continue;
    }

    if (!force && count && count > 0) {
      plan(`${t.label}: NO se elimina (tiene datos: ${count}). Usa DB_CLEANUP_FORCE=true si estas seguro.`);
      continue;
    }

    plan(`${t.label}: DROP TABLE (CASCADE)${count ? ` (rows=${count})` : ""}`);
    if (confirm) {
      await sequelize.query(`DROP TABLE IF EXISTS ${quoteIdent(t.name)} CASCADE;`);
    }
  }

  if (!confirm) {
    if (coreTenantFindings.length > 0) {
      console.log(
        "[DB] tenantId columns detected:",
        coreTenantFindings
          .map((f) => `${f.table}(${f.resolvedName}): ${f.found.length ? f.found.join("/") : "none"}`)
          .join(" | ")
      );
    }

    if (extraTableCounts.length > 0) {
      console.log(
        "[DB] Extra tables detected:",
        extraTableCounts.map((t) => `${t.table}(${t.resolvedName}) rows=${t.count ?? "?"}`).join(" | ")
      );
    }

    console.log("\n--- DB CLEANUP PLAN ---");
    console.log(`mode=${mode} confirm=false (solo plan)`);
    for (const a of plannedActions) console.log(`- ${a}`);

    if (mode === "hard" && plannedActions.length === 0) {
      console.log(
        "\n[DB] Nota: no se planificaron cambios en modo hard. Si esperabas borrar Tenants/tenantId, corre 'npm run db:inspect' con las mismas variables para confirmar a que DB estas conectado."
      );
    }

    console.log("\nPara ejecutar de verdad:");
    console.log("- DB_CONFIRM_NAME=<db> CONFIRM_DB_CLEANUP=true DB_CLEANUP_MODE=soft  npm run db:single-tenant:apply");
    console.log("- DB_CONFIRM_NAME=<db> CONFIRM_DB_CLEANUP=true DB_CLEANUP_MODE=hard  npm run db:single-tenant:apply");
    console.log("(Opcional) DB_CLEANUP_FORCE=true para dropear tablas con datos en modo hard.");
  } else {
    console.log("db-single-tenant-cleanup-ok");
  }
};

(async () => {
  try {
    await sequelize.authenticate();
    await run();
    await sequelize.close();
  } catch (error) {
    console.error("db-single-tenant-cleanup-failed", error);
    process.exit(1);
  }
})();
