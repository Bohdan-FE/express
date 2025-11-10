import Message, { MessageStatus } from '../../models/Message';
import { findUserById } from '../onlineUsers';
import { Server, Socket } from 'socket.io';

export default function messageStatusHandler(io: Server, socket: Socket) {
  socket.on('messageRead', async (messageId: string) => {
    const userId = socket.data.userId;
    if (!userId) return;

    try {
      const msg = await Message.findByIdAndUpdate(
        messageId,
        { status: MessageStatus.READ },
        { new: true },
      );

      if (!msg || msg.to.toString() !== userId) return;

      const sender = findUserById(msg.from.toString());

      if (sender) {
        io.to(sender.socketId).emit('messageStatusUpdate', {
          messageId,
          status: MessageStatus.READ,
        });
      }
      socket.emit('messageStatusUpdate', {
        messageId,
        status: MessageStatus.READ,
      });
    } catch (err) {
      console.error('Error updating message status:', err);
    }
  });
}
