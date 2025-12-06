import { handleSaveError } from './hooks';
import Joi from 'joi';
import { model, Schema, Types } from 'mongoose';

const taskSchema = new Schema(
  {
    title: {
      type: String,
      require: [true, 'Title is required'],
    },
    description: {
      type: String,
    },
    index: {
      type: Number,
      required: [true, 'Index is required'],
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    owner: {
      type: Types.ObjectId,
      ref: 'user',
      required: true,
    },
  },
  { versionKey: false, timestamps: true },
);

taskSchema.post('save', handleSaveError);

const Task = model('task', taskSchema);

export const createTaskSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  index: Joi.number().required(),
  date: Joi.date().required(),
  status: Joi.string().valid('todo', 'in_progress', 'done').default('todo'),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(''),
  index: Joi.number(),
  date: Joi.date(),
  status: Joi.string().valid('todo', 'in_progress', 'done'),
}).or('description', 'index', 'date', 'status');

export const reorderTasksSchema = Joi.object({
  tasks: Joi.array()
    .items(
      Joi.object({
        taskId: Joi.string().required(),
        index: Joi.number().required(),
        status: Joi.string().valid('todo', 'in_progress', 'done'),
      }).required(),
    )
    .required(),
});

export default Task;
