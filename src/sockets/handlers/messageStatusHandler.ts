import { Server, Socket } from 'socket.io';
import { findUserById } from '../onlineUsers';
import Message, { MessageStatus } from '../../models/Message';

export default function messageStatusHandler(io: Server, socket: Socket) {
  socket.on('messageRead', async (messageId: string) => {
    const userId = socket.data.userId;
    if (!userId) return;

    try {
      const msg = await Message.findById(messageId);
      if (!msg || msg.to !== userId) return;

      msg.status = MessageStatus.READ;
      await msg.save();

      const sender = findUserById(msg.from.toString());
      if (sender) {
        io.to(sender.socketId).emit('messageStatusUpdate', {
          messageId,
          status: MessageStatus.READ,
        });
      }
    } catch (err) {
      console.error('Error updating message status:', err);
    }
  });
}
