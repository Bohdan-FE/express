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

  type StatusCount = {
    totalAmount: number;
    in_progress: number;
    todo: number;
    done: number;
  };

  const taskCountMap: Record<string, StatusCount> = {};

  for (const task of tasks) {
    const day = new Date(task.date);
    const dayStr = day.toISOString();

    if (!taskCountMap[dayStr]) {
      taskCountMap[dayStr] = {
        totalAmount: 0,
        in_progress: 0,
        todo: 0,
        done: 0,
      };
    }

    taskCountMap[dayStr].totalAmount += 1;
    if (task.status === 'in_progress') taskCountMap[dayStr].in_progress += 1;
    if (task.status === 'todo') taskCountMap[dayStr].todo += 1;
    if (task.status === 'done') taskCountMap[dayStr].done += 1;
  }

  const result = Object.entries(taskCountMap)
    .map(([date, counts]) => ({
      date,
      ...counts,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.status(200).json(result);
};

const reorderTasks = async (req: Request, res: Response) => {
  try {
    const updates = req.body.tasks;

    const bulkOps = updates.map(
      ({ taskId, index, status }: { taskId: string; index: number; status?: string }) => ({
        updateOne: {
          filter: { _id: taskId },
          update: { 
            $set: { 
              index,
              ...(status && { status })
            } 
          },
        },
      })
    );

    await Task.bulkWrite(bulkOps);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
};

    


export default {
    getAllTasks: cntrWrapper(getAllTasks),
    addTask: cntrWrapper(addTask),
    updateTask: cntrWrapper(updateTask),
    deleteTask: cntrWrapper(deleteTask),
    getAmountTasksByPeriod: cntrWrapper(getAmountOfTasksByPeriod),
    reorderTasks: cntrWrapper(reorderTasks)
}