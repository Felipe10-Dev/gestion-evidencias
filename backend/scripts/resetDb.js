const { sequelize } = require("../src/config/database");

(async () => {
  try {
    await sequelize.authenticate();

    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'SequelizeMeta'"
    );

    const names = tables.map((t) => t.tablename).filter(Boolean);

    if (names.length > 0) {
      const quoted = names.map((n) => `\"${n.replace(/\"/g, "\"\"")}\"`).join(", ");
      await sequelize.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
    }

    const counts = {};
    for (const n of names) {
      const safe = n.replace(/\"/g, "\"\"");
      const [rows] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM \"${safe}\"`);
      counts[n] = rows[0].count;
    }

    console.log("db-reset-ok");
    console.log(JSON.stringify(counts));

    await sequelize.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
