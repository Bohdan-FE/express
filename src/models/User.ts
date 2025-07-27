import Joi from 'joi'
import { Schema, model } from "mongoose";
import { handleSaveError } from "./hooks";

const emailRegexp = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/

const userSchema = new Schema({
  password: {
    type: String,
    required: [true, 'Set password for user'],
  },
  email: { 
    type: String,
    required: [true, 'Email is required'],
    match: emailRegexp,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  token: String,
  avatarURL: String,
}, { versionKey: false, timestamps: true })

userSchema.post('save', handleSaveError)

const User = model('user', userSchema)

export const registerSchema = Joi.object({
    email: Joi.string().pattern(emailRegexp).required(),
    password: Joi.string().required(),
    name: Joi.string().min(3).max(30).required(),
})

export const loginSchema = Joi.object({
    email: Joi.string().pattern(emailRegexp).required(),
    password: Joi.string().required(),
})

export default User