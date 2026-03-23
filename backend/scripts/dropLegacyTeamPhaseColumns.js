const { sequelize } = require("../src/config/database");

(async () => {
  try {
    await sequelize.authenticate();

    await sequelize.query('ALTER TABLE "Teams" DROP COLUMN IF EXISTS drive_folder_antes_id;');
    await sequelize.query('ALTER TABLE "Teams" DROP COLUMN IF EXISTS drive_folder_durante_id;');
    await sequelize.query('ALTER TABLE "Teams" DROP COLUMN IF EXISTS drive_folder_despues_id;');

    const [cols] = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='Teams' ORDER BY ordinal_position"
    );

    console.log("team-columns-updated");
    console.log(cols.map((c) => c.column_name).join(","));

    await sequelize.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
