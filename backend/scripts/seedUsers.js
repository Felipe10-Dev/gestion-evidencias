const bcrypt = require("bcrypt");
const { sequelize, User } = require("../src/config/database");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✓ BD conectada");

    const users = [
      {
        nombre: "Admin Test",
        email: "admin@test.com",
        password: await bcrypt.hash("Admin123!", 10),
        rol: "admin",
      },
      {
        nombre: "Técnico Test",
        email: "tecnico@test.com",
        password: await bcrypt.hash("Tecnico123!", 10),
        rol: "tecnico",
      },
    ];

    for (const userData of users) {
      const existing = await User.findOne({ where: { email: userData.email } });
      if (!existing) {
        await User.create(userData);
        console.log(`✓ Usuario creado: ${userData.email}`);
      } else {
        console.log(`⊘ Usuario ya existe: ${userData.email}`);
      }
    }

    console.log("\n📝 Credenciales para testing:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("ADMIN:");
    console.log("  Email: admin@test.com");
    console.log("  Pass:  Admin123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TÉCNICO:");
    console.log("  Email: tecnico@test.com");
    console.log("  Pass:  Tecnico123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
