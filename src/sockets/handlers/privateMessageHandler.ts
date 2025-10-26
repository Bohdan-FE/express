import { Server, Socket } from 'socket.io';

import { findUserById } from '../onlineUsers';
import Message, { MessageStatus } from '../../models/Message';


export default function privateMessageHandler(io: Server, socket: Socket) {
  socket.on('privateMessage', async ({ to, message }: { to: string; message: string }) => {
    const from = socket.data.userId;
    if (!from) return socket.emit('errorMessage', 'You must register first');

    try {
      const savedMsg = await Message.create({ from, to, message, status: 'sent' });
      

      const target = findUserById(to);
      if (target) {
        await Message.findByIdAndUpdate(savedMsg._id, { status: MessageStatus.DELIVERED });
        io.to(target.socketId).emit('privateMessage', {
          _id: savedMsg._id,
          from,
          message,
          status: MessageStatus.DELIVERED,
          createdAt: savedMsg.createdAt,
        });
      }

      socket.emit('privateMessage', {
        _id: savedMsg._id,
        from,
        message,
        status: target ? MessageStatus.DELIVERED : MessageStatus.SENT,
        createdAt: savedMsg.createdAt,
      });
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('errorMessage', 'Failed to send message');
    }
  });
}
