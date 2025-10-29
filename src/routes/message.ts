import messagesControler from '../controllers/message-controler';
import { authenticate } from '../middlewares';
import express from 'express';

const router = express.Router();

router.get('/:id', authenticate, messagesControler.getMessages);

router.get(
  '/unread/count',
  authenticate,
  messagesControler.getUnreadMessagesCount,
);

export default router;
