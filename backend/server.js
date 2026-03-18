const expressApp = require('./expressApp')
const { connectDB, sequelize } = require('./src/config/database')

require('./src/models')

const PORT = process.env.PORT || 3000

const startServer = async () => {
  await connectDB()

  await sequelize.sync({ alter: true })

  expressApp.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`)
  })
}

startServer()