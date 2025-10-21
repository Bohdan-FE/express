import express from "express";
import { authenticate } from "../middlewares";
import messagesControler from "../controllers/messages-controler";


const router = express.Router();

router.get("/", authenticate, messagesControler.getMessages)

export default router;