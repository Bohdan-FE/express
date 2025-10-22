import express from "express";
import { authenticate, isEmptyBody, isValidId } from "../middlewares";
import taskController from "../controllers/task-controller";
import { validateBody } from "../decorators";
import { createTaskSchema, reorderTasksSchema, updateTaskSchema } from "../models/Task";
import { isValid } from "zod";

const router = express.Router();

router.get("/", authenticate, taskController.getAllTasks)

router.post("/", authenticate, isEmptyBody, validateBody(createTaskSchema), taskController.addTask) 

router.delete("/:id", authenticate, isValidId, taskController.deleteTask)

router.get("/amount", authenticate, taskController.getAmountTasksByPeriod)

router.patch('/reorder', authenticate, isEmptyBody, validateBody(reorderTasksSchema), taskController.reorderTasks);

router.patch("/:id", authenticate, isEmptyBody, isValidId, validateBody(updateTaskSchema), taskController.updateTask)

export default router

