import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const updateUserAvatarUrl = async (userId, fileBuffer) => {
  const result = await saveFileToCloudinary(fileBuffer);
  
  const user = await User.findByIdAndUpdate(
    userId,
    { avatar: result.secure_url },
    { new: true },
  );

  return user.avatar;
};
