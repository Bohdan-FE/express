import { TypedSocket } from '..';
import { HttpError } from '../../helpers';
import Friendship from '../../models/Friendship';
import User from '../../models/User';
import { findUserById } from '../onlineUsers';
import { Server } from 'socket.io';

export default function friendsRequestHandler(io: Server, socket: TypedSocket) {
  socket.on('sendFriendRequest', async (targetId: string) => {
    try {
      const userId = socket.data.userId;
      const requesterName = socket.data.userName;

      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        throw HttpError(404, 'Target user not found');
      }

      const existing = await Friendship.findOne({
        $or: [
          { requester: userId, recipient: targetId },
          { requester: targetId, recipient: userId },
        ],
      });

      if (existing) {
        throw HttpError(
          401,
          'Friend request already exists or you are already friends',
        );
      }

      const friendship = await Friendship.create({
        requester: userId,
        recipient: targetId,
        recipientName: targetUser.name,
        requesterName,
        status: 'pending',
      });

      const targetUserId = findUserById(targetId.toString())?.socketId;

      if (targetUserId) {
        io.to(targetUserId).emit('friendRequestReceived', {
          message: 'New friend request received',
          data: friendship,
        });
      }

      socket.emit('friendRequestSent', {
        message: 'Friend request sent',
        data: friendship,
      });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('acceptFriendRequest', async (requesterId: string) => {
    try {
      const userId = socket.data.userId;

      const friendship = await Friendship.findOneAndUpdate(
        { requester: requesterId, recipient: userId, status: 'pending' },
        { status: 'accepted' },
        { new: true },
      );

      if (!friendship) throw HttpError(404, 'Friend request not found');

      const requesterSocketId = findUserById(requesterId.toString())?.socketId;

      if (requesterSocketId) {
        io.to(requesterSocketId).emit('friendRequestAccepted', {
          message: 'Your friend request was accepted',
          data: friendship,
        });
      }

      io.to(requesterId.toString()).emit('friendRequestAccepted', {
        message: 'Your friend request was accepted',
        data: friendship,
      });

      socket.emit('friendRequestAccepted', {
        message: 'Friend request accepted',
        data: friendship,
      });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('rejectFriendRequest', async (requesterId: string) => {
    try {
      const userId = socket.data.userId;

      await Friendship.findOneAndDelete({
        $or: [
          { requester: userId, recipient: requesterId },
          { requester: requesterId, recipient: userId },
        ],
        status: 'pending',
      });

      const requesterSocketId = findUserById(requesterId.toString())?.socketId;

      if (requesterSocketId) {
        io.to(requesterSocketId).emit('friendRequestRejected', {
          message: 'Your friend request was rejected',
        });
      }

      socket.emit('friendRequestRejected', {
        message: 'Friend request rejected',
      });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('removeFriend', async (friendId: string) => {
    try {
      const userId = socket.data.userId;

      await Friendship.findOneAndDelete({
        status: 'accepted',
        $or: [
          { requester: userId, recipient: friendId },
          { requester: friendId, recipient: userId },
        ],
      });

      const friendSocketId = findUserById(friendId.toString())?.socketId;

      if (friendSocketId) {
        io.to(friendSocketId).emit('friendRemoved', {
          message: 'You were removed from friends',
        });
      }

      socket.emit('friendRemoved', {
        message: 'Friend removed',
      });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });
}
