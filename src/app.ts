import express, { NextFunction, Request, Response } from 'express'
import logger from 'morgan'
import cors from 'cors'
import authRouter from './routes/auth'
import taskRouter from './routes/task'
import userRouter from './routes/user'
import 'dotenv/config'

const app = express()


const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short'

app.use(logger(formatsLogger))
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

app.use('/auth/', authRouter)
app.use('/tasks/', taskRouter)
app.use('/users/', userRouter)

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const {status = 500, message = 'server error'} = err
  res.status(status).json({message})
})

export default app