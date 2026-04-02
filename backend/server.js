const expressApp = require('./expressApp')
const { connectDB, sequelize } = require('./src/config/database')
const runMigrations = require('./src/db/runMigrations')

require('./src/models')

const PORT = process.env.PORT || 3000
const isProduction = process.env.NODE_ENV === 'production'

const shouldAlterSchema = () => {
  if (process.env.DB_SYNC_ALTER === 'true') return true
  if (process.env.DB_SYNC_ALTER === 'false') return false

  // Backward compatible: keep auto-alter in local/dev unless explicitly disabled.
  return !isProduction
}

const startServer = async () => {
  try {
    await connectDB()

    // Run safe additive migrations first (never drops columns/tables).
    await runMigrations({ sequelize })

    // In production, avoid sync({ alter: true }) to prevent destructive schema changes.
    const alter = shouldAlterSchema()
    await sequelize.sync({ alter })

    if (isProduction && alter) {
      console.warn('[DB] Advertencia: DB_SYNC_ALTER esta activo en produccion. Esto puede alterar el schema en Railway.')
    }

    expressApp.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`)
    })
  } catch (error) {
    console.error('No fue posible iniciar el servidor:', error)
    process.exit(1)
  }
}

startServer()