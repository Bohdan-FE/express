import authRouter from './routes/auth';
import friendshipRouter from './routes/friend';
import messagesRouter from './routes/message';
import taskRouter from './routes/task';
import userRouter from './routes/user';
import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import logger from 'morgan';

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(
  cors({
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'https://react-monorepo-eta.vercel.app',
      'https://stenohaline-cuc-unimposing.ngrok-free.dev',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  }),
);
app.options('*', cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/auth/', authRouter);
app.use('/tasks/', taskRouter);
app.use('/users/', userRouter);
app.use('/messages/', messagesRouter);
app.use('/friends/', friendshipRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const { status = 500, message = 'server error' } = err;
  res.status(status).json({ message });
});

export default app;
