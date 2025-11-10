import { TypedSocket } from '..';
import User from '../../models/User';
import { addOnlineUser } from '../onlineUsers';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

export default async function registerHandler(
  io: Server,
  socket: TypedSocket,
  token: string,
) {
  try {
    if (!process.env.SECRET_KEY) {
      throw new Error('SECRET_KEY is not defined');
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user || !user.token || user.token !== token) {
      socket.emit('error', { message: 'Unauthorized' });
      socket.disconnect(true);
      return;
    }

    socket.data.userId = user.id;
    socket.data.userName = user.name;

    addOnlineUser(user.id, socket.id);

    await User.findByIdAndUpdate(user.id, {
      isOnline: true,
      lastSeen: new Date(),
    });

    io.emit('user_status_change', { userId: user.id, isOnline: true });

    socket.emit('registered', { userId: user.id });

    console.log(`✅ User ${user.name} (${user.id}) is now online`);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      socket.emit('error', { message: 'Token has expired' });
    } else {
      socket.emit('error', { message: 'Unauthorized' });
    }

    console.error('❌ Socket auth error:', error);
    socket.disconnect(true);
  }
}
