import express from "express";
import { authenticate } from "../middlewares";
import userController from "../controllers/user-controller";

const router = express.Router();

router.get("/", authenticate, userController.getUsers)

export default router;