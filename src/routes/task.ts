import express from "express";
import { authenticate, isEmptyBody } from "../middlewares";
import taskController from "../controllers/task-controller";
import { validateBody } from "../decorators";
import { createTaskSchema, reorderTasksSchema, updateTaskSchema } from "../models/Task";

const router = express.Router();

router.get("/", authenticate, taskController.getAllTasks)

router.post("/", authenticate, isEmptyBody, validateBody(createTaskSchema), taskController.addTask) 

router.delete("/:taskId", authenticate, taskController.deleteTask)

router.get("/amount", authenticate, taskController.getAmountTasksByPeriod)

router.patch('/reorder', authenticate, isEmptyBody, validateBody(reorderTasksSchema), taskController.reorderTasks);

router.patch("/:taskId", authenticate, isEmptyBody, validateBody(updateTaskSchema), taskController.updateTask)

export default router

