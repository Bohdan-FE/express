import Message, { MessageStatus } from '../../models/Message';
import { findUserById } from '../onlineUsers';
import { Server, Socket } from 'socket.io';

export default function privateMessageHandler(io: Server, socket: Socket) {
  socket.on(
    'privateMessage',
    async ({
      to,
      message,
      imageUrl,
    }: {
      to: string;
      message?: string;
      imageUrl?: string;
    }) => {
      const from = socket.data.userId;
      if (!from) return socket.emit('errorMessage', 'You must register first');

      try {
        const savedMsg = await Message.create({
          from,
          to,
          message,
          status: MessageStatus.SENT,
          imageUrl,
        });

        const target = findUserById(to);

        console.log(
          `Private message from ${from} to ${to}: ${message || '[image]'}`,
        );
        if (target) {
          await Message.findByIdAndUpdate(savedMsg._id, {
            status: MessageStatus.DELIVERED,
          });
          io.to(target.socketId).emit('privateMessage', {
            _id: savedMsg._id,
            from,
            message,
            status: MessageStatus.DELIVERED,
            createdAt: savedMsg.createdAt,
            imageUrl: savedMsg.imageUrl,
          });
        }

        socket.emit('privateMessage', {
          _id: savedMsg._id,
          from,
          message,
          status: target ? MessageStatus.DELIVERED : MessageStatus.SENT,
          createdAt: savedMsg.createdAt,
          imageUrl: savedMsg.imageUrl,
        });
      } catch (err) {
        console.error('Error saving message:', err);
        socket.emit('errorMessage', 'Failed to send message');
      }
    },
  );
}
