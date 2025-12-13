import authRouter from './routes/auth';
import friendshipRouter from './routes/friend';
import mailRouter from './routes/mail';
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

app.use(express.json());
app.use(express.static('public'));

// CORS configuration
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4252',
  'https://react-monorepo-eta.vercel.app',
  'https://api.apidashboard.online',
  'https://www.bohdanvivchar.space',
  'https://bohdanvivchar.space',
];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) return callback(null, true); // mobile apps, curl, servers

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith('.ngrok-free.dev') ||
      origin.includes('trycloudflare.com');

    if (isAllowed) {
      return callback(null, true);
    }

    console.log('❌ Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'ngrok-skip-browser-warning',
  ],

  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
};

// Log incoming origin for debugging
app.use((req, res, next) => {
  console.log('Incoming Origin:', req.headers.origin);
  next();
});

app.use(cors(corsOptions));

app.use('/auth/', authRouter);
app.use('/tasks/', taskRouter);
app.use('/users/', userRouter);
app.use('/messages/', messagesRouter);
app.use('/friends/', friendshipRouter);
app.use('/mail/', mailRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const { status = 500, message = 'server error' } = err;
  res.status(status).json({ message });
});

export default app;
