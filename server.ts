
import mongoose from 'mongoose'
import app from './src/app'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { registerSocketHandlers } from './src/sockets'

const { DB_HOST = '', PORT = 3000 } = process.env

mongoose.connect(DB_HOST, {
  dbName: 'db-dashboard',
})
  .then(() => {
    console.log('Database connection successful')

    const server = createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*", 
      },
    });

    registerSocketHandlers(io)

    server.listen(PORT, () => {
    console.log(`Server running. Use our API on port: ${PORT}`)
    })
  })
  .catch(error => {
    console.log(error.message)
    process.exit(1)
  })