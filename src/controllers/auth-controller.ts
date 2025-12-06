import { ctrlWrapper } from '../decorators';
import { HttpError } from '../helpers';
import { deleteFromS3 } from '../middlewares/';
import User from '../models/User';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import gravatar from 'gravatar';
import jwt from 'jsonwebtoken';

const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, 'Email is already in use');
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL: '',
  });
  res.status(201).json({
    email: newUser.email,
    avatarURL: '',
    name,
  });
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, 'Email or password invalid');
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, 'Email or password invalid');
  }
  const payload = {
    id: user._id,
  };
  if (!process.env.SECRET_KEY) {
    throw HttpError(500, 'Environment variable not set');
  }
  const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '72h' });
  await User.findByIdAndUpdate(user._id, { token });
  res.json({
    token,
    email: user.email,
    name: user.name,
    _id: user._id,
    avatarURL: user.avatarURL,
  });
};

const getCurrent = async (req: Request, res: Response) => {
  const { email, name, id, avatarURL } = req.user;
  res.json({
    email,
    name,
    _id: id,
    avatarURL,
    isOnline: req.user.isOnline,
    lastSeen: req.user.lastSeen,
  });
};

const logout = async (req: Request, res: Response) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: '' });
  res.status(204).json();
};

const updateUser = async (req: Request, res: Response) => {
  const user = req.user;
  const { oldPassword, newPassword, name } = req.body;

  if (!user) throw HttpError(404, 'User not found');

  const updateData: {
    email?: string;
    name?: string;
    avatarURL?: string;
  } = {};

  if (oldPassword && newPassword) {
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw HttpError(401, 'Old password is incorrect');
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, { password: hashPassword });
  }

  if (name && name !== user.name) {
    const existingName = await User.findOne({ name });
    if (existingName) {
      throw HttpError(409, 'Name already in use');
    }
    updateData.name = name;
  }

  if (req.file && (req.file as any).location) {
    if (user.avatarURL) {
      await deleteFromS3(user.avatarURL);
    }

    updateData.avatarURL = (req.file as any).location;
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
    new: true,
  });

  res.json({
    _id: updatedUser!._id,
    email: updatedUser!.email,
    name: updatedUser!.name,
    avatarURL: updatedUser!.avatarURL,
  });
};

const googleAuth = async (req: Request, res: Response) => {
  const { access_token } = req.body;
  const googleUser = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: { Authorization: `Bearer ${access_token}` },
    },
  ).then((res) => res.json());

  const { email, name, picture } = googleUser;

  const user = await User.findOne({ email });

  if (user) {
    const token = jwt.sign(
      { id: user?._id },
      process.env.SECRET_KEY as string,
      {
        expiresIn: '72h',
      },
    );

    await User.findByIdAndUpdate(user._id, { token });

    res.json({
      token,
      email: user.email,
      name: user.name,
      _id: user._id,
      avatarURL: user.avatarURL,
    });
    return;
  }

  res.json({
    email,
    name,
    avatarURL: picture,
  });
};

export default {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateUser: ctrlWrapper(updateUser),
  googleAuth: ctrlWrapper(googleAuth),
};
