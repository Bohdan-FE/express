import { Server, Socket } from 'socket.io'
import registerChatHandlers from './chat'


export const registerSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('🔥 New user connected:', socket.id)

    // Register your socket modules
    registerChatHandlers(io, socket)


    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id)
    })
  })
}