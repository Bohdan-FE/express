import { Socket, Server } from 'socket.io';
import { removeOnlineUser } from '../onlineUsers';
import User from '../../models/User';

export default function disconnectHandler(io: Server, socket: Socket) {
  socket.on('disconnect', async (reason) => {
    try {
      const userId = socket.data.userId;

      if (!userId) return;

      removeOnlineUser(socket.id);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit('user_status_change', { userId, isOnline: false });

      console.log(`💤 User ${userId} disconnected (${reason})`);
    } catch (error) {
      console.error('❌ Error handling disconnect:', error);
    }
  });
}
