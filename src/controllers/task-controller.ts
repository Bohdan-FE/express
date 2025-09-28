import { Request, Response } from "express"
import cntrWrapper from "../decorators/ctrlWrapper"
import Task from "../models/Task"
import { HttpError } from "../helpers"


const getAllTasks = async (req: Request, res: Response) => {
    const { _id: owner } = req.user;
    const { date } = req.query;
  
    if (!date) {
     res.status(400).json({ message: 'Date is required' });
     return
    }
  
    const startOfDay = new Date(date as string);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date as string);
    endOfDay.setUTCHours(23, 59, 59, 999);
  
    const tasks = await Task.find(
      {
        owner,
        date: { $gte: startOfDay, $lte: endOfDay }
      },
      '-createdAt -updatedAt -owner'
    );
  
    res.json(tasks);
}

const addTask = async (req: Request, res: Response) => {
    const { _id: owner } = req.user
    const newTask = await Task.create({ ...req.body, owner })
    res.status(201).json(newTask)
}

const updateTask = async (req: Request, res: Response) => {
    const { _id: owner } = req.user
    const { taskId } = req.params
    const updatedTask = await Task.findByIdAndUpdate(
        { _id: taskId, owner },
        req.body,
        { new: true, runValidators: true }
    )
    if (!updatedTask) {
        throw HttpError(404, `Task with id:${taskId} is not found`)
    }
    res.json(updatedTask)
}

const deleteTask = async (req: Request, res: Response) => {
    const { _id: owner } = req.user
    const { taskId } = req.params
    const deletedTask = await Task.findByIdAndDelete({ _id: taskId, owner })
    if (!deletedTask) {
        throw HttpError(404, `Task with id:${taskId} is not found`)
    }
    res.json({
        message: 'Task deleted'
    })
}


const getAmountOfTasksByPeriod = async (req: Request, res: Response) => {
  const { _id: owner } = req.user;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400).json({ message: 'Start date and end date are required' });
    return;
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  const tasks = await Task.find({
    owner,
    date: { $gte: start, $lte: end },
  });

  const taskCountMap: Record<string, number> = {};
  for (const task of tasks) {
    const day = new Date(task.date).toISOString();
    taskCountMap[day] = (taskCountMap[day] || 0) + 1;
  }

  const result = Object.entries(taskCountMap).map(([date, amount]) => ({
    date,
    amount,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json(result);
};

const reorderTasks = async (req: Request, res: Response) => {
    const updates = req.body.tasks;
  
    const bulkOps = updates.map(({ taskId, index }: {taskId: string, index: number}) => ({
      updateOne: {
        filter: { _id: taskId },
        update: { $set: { index } },
      },
    }));
  
    await Task.bulkWrite(bulkOps);
  
    res.status(200).json({ success: true });
  };
    


export default {
    getAllTasks: cntrWrapper(getAllTasks),
    addTask: cntrWrapper(addTask),
    updateTask: cntrWrapper(updateTask),
    deleteTask: cntrWrapper(deleteTask),
    getAmountTasksByPeriod: cntrWrapper(getAmountOfTasksByPeriod),
    reorderTasks: cntrWrapper(reorderTasks)
}