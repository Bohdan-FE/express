import { Socket } from 'socket.io';
import { removeOnlineUser } from '../onlineUsers';

export default function disconnectHandler(socket: Socket) {
  socket.on('disconnect', () => {
    removeOnlineUser(socket.id);
  });
}
