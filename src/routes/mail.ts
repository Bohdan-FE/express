import mailController from '../controllers/mail-controller';
import express from 'express';

const router = express.Router();

router.post('/send-message', mailController.sendMail);

export default router;
