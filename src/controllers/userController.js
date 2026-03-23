import createHttpError from 'http-errors';
import { updateUserAvatarUrl } from '../services/userService.js';

export const updateUserAvatar = async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, 'No file');
  }

  const avatarUrl = await updateUserAvatarUrl(req.user._id, req.file.buffer);

  res.status(200).json({ url: avatarUrl });
};
