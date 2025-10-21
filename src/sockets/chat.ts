import { Server, Socket } from 'socket.io'
import Message from '../models/Message'
import mongoose from 'mongoose'


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

socket.on(
  'privateMessage',
  async ({ to, message }: { to: string; message: string }) => {
    const from = socket.data.userId;

    if (!from) {
      return socket.emit('errorMessage', 'You must register first');
    }

    try {
      // Convert to ObjectId before saving
      const savedMsg = await Message.create({
        from,
        to,
        message,
      });

      // Find recipient
      const target = onlineUsers.find((u) => u.userId === to);

      // Send to recipient if online
      if (target) {
        io.to(target.socketId).emit('privateMessage', {
          from,
          message,
          timestamp: savedMsg.createdAt,
        });
      }

      // Also emit back to sender for confirmation
      socket.emit('privateMessage', {
        from,
        message,
        timestamp: savedMsg.createdAt,
      });
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('errorMessage', 'Failed to send message');
    }
  }
);

  socket.on('disconnect', () => {
    const index = onlineUsers.findIndex((u) => u.socketId === socket.id)
    if (index !== -1) onlineUsers.splice(index, 1)
  })
}
