import  { model, Schema, Types } from "mongoose";
import { handleSaveError } from "./hooks";
import Joi, { date } from "joi";

const taskSchema = new Schema({
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    index: {
        type: Number,
        required: [true, 'Index is required'],
    },
    done: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
    },
    owner: {
        type: Types.ObjectId, 
        ref: 'user',  
        required: true,     
      }
}, { versionKey: false, timestamps: true })

taskSchema.post('save', handleSaveError)

const Task = model('task', taskSchema)

export const createTaskSchema = Joi.object({
    description: Joi.string().required(),
    index: Joi.number().required(),
    date: Joi.date().required(),
})

export const updateTaskSchema = Joi.object({
    description: Joi.string(),
    index: Joi.number(),
    done: Joi.boolean(),
    date: Joi.date(),
}).or('description', 'index', 'done', 'date')

export const reorderTasksSchema = Joi.object({
    tasks: Joi.array().items(
      Joi.object({
        taskId: Joi.string().required(),
        index: Joi.number().required(),
      }).required()
    ).required()
  });

export default Task