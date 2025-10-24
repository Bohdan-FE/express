import { Server, Socket } from 'socket.io'
import privateMessageHandler from './handlers/privateMessageHandler'
import messageStatusHandler from './handlers/messageStatusHandler'
import disconnectHandler from './handlers/disconnectHandler'
import registerHandler from './handlers/registerHandler'


export const registerSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('🔥 New user connected:', socket.id)

  socket.on('register', async (token: string) => {
    await registerHandler(socket, token);
  });
  privateMessageHandler(io, socket);
  messageStatusHandler(io, socket);
  disconnectHandler(socket);


    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id)
    })
  })
}