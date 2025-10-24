import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { addOnlineUser } from '../onlineUsers';
import User from '../../models/User';

export default async function registerHandler(socket: Socket, token: string) {
  try {
    if (!process.env.SECRET_KEY) throw new Error('SECRET_KEY is not defined');

    const { id } = jwt.verify(token, process.env.SECRET_KEY) as { id: string };
    const user = await User.findById(id);

    if (!user || !user.token || user.token !== token) {
      socket.emit('error', { message: 'Unauthorized' });
      socket.disconnect(true);
      return;
    }

    socket.data.userId = user.id;
    addOnlineUser(user.id, socket.id);

    socket.emit('registered', { userId: user.id });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      socket.emit('error', { message: 'Token has expired' });
    } else {
      socket.emit('error', { message: 'Unauthorized' });
    }
    socket.disconnect(true);
  }
}
