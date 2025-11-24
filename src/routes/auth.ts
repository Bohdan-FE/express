import authController from '../controllers/auth-controller';
import { validateBody } from '../decorators';
import { authenticate, isEmptyBody, upload } from '../middlewares';
import { loginSchema, registerSchema } from '../models/User';
import express from 'express';

const router = express.Router();

router.post(
  '/register',
  isEmptyBody,
  validateBody(registerSchema),
  authController.register,
);

router.post(
  '/login',
  isEmptyBody,
  validateBody(loginSchema),
  authController.login,
);

router.get('/current', authenticate, authController.getCurrent);

router.post('/logout', authenticate, authController.logout);

// router.patch(
//   '/avatars',
//   authenticate,
//   upload.single('avatar'),
//   authController.updateAvatar,
// );

router.post('/google', isEmptyBody, authController.googleAuth);

router.patch(
  '/update',
  authenticate,
  upload.single('avatar'),
  authController.updateUser,
);

export default router;
