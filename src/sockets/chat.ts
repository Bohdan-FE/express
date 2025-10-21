import { Server, Socket } from 'socket.io'
import Message from '../models/Message'


interface OnlineUser {
  userId: string
  socketId: string
}

const onlineUsers: OnlineUser[] = []

export default function registerChatHandlers(io: Server, socket: Socket) {
  socket.on('register', (userId: string) => {
    socket.data.userId = userId
    onlineUsers.push({ userId, socketId: socket.id })
  })

  socket.on('privateMessage', async ({ to, message }: { to: string; message: string }) => {
    const from = socket.data.userId
    if (!from) return socket.emit('errorMessage', 'You must register first')

    const savedMsg = await Message.create({ from, to, message })

    const target = onlineUsers.find((u) => u.userId === to)

    if (target) {
      io.to(target.socketId).emit('privateMessage', {
        from,
        message,
        timestamp: savedMsg.timestamp,
      })
    }

    socket.emit('privateMessage', {
      from,
      message,
      timestamp: savedMsg.timestamp,
    })
  })

  socket.on('getHistory', async ({ withUser }: { withUser: string }) => {
    const from = socket.data.userId
    if (!from) return socket.emit('errorMessage', 'You must register first')

    const history = await Message.find({
      $or: [
        { from, to: withUser },
        { from: withUser, to: from },
      ],
    }).sort({ timestamp: 1 })

    socket.emit('chatHistory', history)
  })

  socket.on('disconnect', () => {
    const index = onlineUsers.findIndex((u) => u.socketId === socket.id)
    if (index !== -1) onlineUsers.splice(index, 1)
  })
}
