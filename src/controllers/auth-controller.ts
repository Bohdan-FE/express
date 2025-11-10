import { ctrlWrapper } from '../decorators';
import { HttpError } from '../helpers';
import User from '../models/User';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import gravatar from 'gravatar';
import * as Jimp from 'jimp';
import jwt from 'jsonwebtoken';
import path from 'path';

const avatarDir = path.resolve('public', 'avatars');

const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, 'Email is already in use');
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const newUser = await User.create({ ...req.body, password: hashPassword });
  res.status(201).json({
    email: newUser.email,
    avatarURL,
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
    id: user._id,
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

const updateAvatar = async (req: Request, res: Response) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.body.file;
  const newFileName = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarDir, newFileName);

  const file = await (Jimp as any).read(tempUpload);
  await file.resize(250, 250).writeAsync(tempUpload);

  await fs.rename(tempUpload, resultUpload);

  const avatarURL = path.join('avatars', newFileName);
  await User.findByIdAndUpdate(_id, { avatarURL });
  res.json({
    avatarURL,
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
  updateAvatar: ctrlWrapper(updateAvatar),
  googleAuth: ctrlWrapper(googleAuth),
};
