interface OnlineUser {
  userId: string;
  socketId: string;
}

export const onlineUsers: OnlineUser[] = [];

export function addOnlineUser(userId: string, socketId: string) {
  if (!onlineUsers.some((u) => u.userId === userId)) {
    onlineUsers.push({ userId, socketId });
  }
}

export function removeOnlineUser(socketId: string) {
  const index = onlineUsers.findIndex((u) => u.socketId === socketId);
  if (index !== -1) onlineUsers.splice(index, 1);
}

export function findUserById(userId: string) {
  return onlineUsers.find((u) => u.userId === userId);
}
