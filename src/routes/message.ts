import messagesControler from '../controllers/message-controler';
import { authenticate } from '../middlewares';
import { uploadMessageImage } from '../middlewares/';
import express from 'express';

const router = express.Router();

router.get('/:id', authenticate, messagesControler.getMessages);

router.get(
  '/unread/count',
  authenticate,
  messagesControler.getUnreadMessagesCount,
);

router.post(
  '/image',
  authenticate,
  uploadMessageImage.single('image'),
  messagesControler.uploadMessageImage,
);

export default router;
