
import mongoose from 'mongoose'
import app from './src/app'

const { DB_HOST = '', PORT = 3000 } = process.env

mongoose.connect(DB_HOST, {
  dbName: 'db-dashboard',
})
  .then(() => {
    console.log('Database connection successful')
    app.listen(3000, () => {
    console.log(`Server running. Use our API on port: ${PORT}`)
    })
  })
  .catch(error => {
    console.log(error.message)
    process.exit(1)
  })