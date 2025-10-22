import express from "express";
import { authenticate, isValidId } from "../middlewares";
import friendshipController from "../controllers/friendship-controller";

const router = express.Router();

router.get("/", authenticate, friendshipController.getFriends);
router.post("/request/:id", authenticate, isValidId, friendshipController.sendFriendRequest);
router.post("/accept/:id", authenticate, isValidId, friendshipController.acceptFriendRequest);
router.post("/reject/:id", authenticate, isValidId, friendshipController.rejectFriendRequest);
router.delete("/:id", authenticate, isValidId, friendshipController.removeFriend);

export default router;
