import { Server, Socket } from "socket.io";
import { findUserById } from "../onlineUsers";

 export default function typingHandler(io: Server, socket: Socket) {
  socket.on("typing", (userId: string) => {
    const target = findUserById(userId);
    if (target) {
      io.to(target.socketId).emit("typing", socket.data.userId);
    }
  });
}