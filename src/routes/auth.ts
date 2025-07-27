import express from 'express'
import { validateBody } from '../decorators'
import authController from '../controllers/auth-controller'
import { loginSchema, registerSchema } from '../models/User'
import { authenticate, isEmptyBody, upload } from '../middlewares'

const router = express.Router()

router.post('/register', isEmptyBody, validateBody(registerSchema), authController.register)

router.post('/login', isEmptyBody, validateBody(loginSchema), authController.login)

router.get('/current', authenticate, authController.getCurrent)

router.post('/logout', authenticate, authController.logout)

router.patch('/avatars', authenticate, upload.single('avatar'), authController.updateAvatar)

export default router