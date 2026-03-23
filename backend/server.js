const expressApp = require('./expressApp')
const { connectDB, sequelize } = require('./src/config/database')

require('./src/models')

const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await connectDB()

    await sequelize.sync({ alter: true })

    expressApp.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`)
    })
  } catch (error) {
    console.error('No fue posible iniciar el servidor:', error)
    process.exit(1)
  }
}

startServer()