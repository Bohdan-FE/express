import app from './src/app';
import { registerSocketHandlers } from './src/sockets';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

const { DB_HOST = '', PORT = 3000 } = process.env;

mongoose
  .connect(DB_HOST, {
    dbName: 'db-dashboard',
  })
  .then(() => {
    console.log('Database connection successful');

    const server = createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*',
      },
    });

    registerSocketHandlers(io);

    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
