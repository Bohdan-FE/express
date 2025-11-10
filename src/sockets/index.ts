import disconnectHandler from './handlers/disconnectHandler';
import friendsRequestHandler from './handlers/friendsRequestHandler';
import messageStatusHandler from './handlers/messageStatusHandler';
import privateMessageHandler from './handlers/privateMessageHandler';
import registerHandler from './handlers/registerHandler';
import typingHandler from './handlers/typingHandler';
import { Server, Socket } from 'socket.io';

interface MySocketData {
  userId: string;
  userName: string;
}

export type TypedSocket = Socket<any, any, any, MySocketData>;

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    socket.on('register', async (token: string) => {
      await registerHandler(io, socket, token);
    });
    privateMessageHandler(io, socket);
    messageStatusHandler(io, socket);
    typingHandler(io, socket);
    disconnectHandler(io, socket);
    friendsRequestHandler(io, socket);

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });
};
