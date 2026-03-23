import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUserAvatarUrl } from '../src/services/userService.js';
import { User } from '../src/models/user.js';
import { saveFileToCloudinary } from '../src/utils/saveFileToCloudinary.js';

// Mock dependencies
vi.mock('../src/models/user.js', () => ({
  User: {
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('../src/utils/saveFileToCloudinary.js', () => ({
  saveFileToCloudinary: vi.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateUserAvatarUrl', () => {
    it('should save file to cloudinary and update user avatar in DB', async () => {
      // Arrange
      const mockUserId = 'user123';
      const mockFileBuffer = Buffer.from('test image data');
      const mockCloudinaryResult = { secure_url: 'https://cloudinary.com/image.jpg' };
      const mockUpdatedUser = { _id: mockUserId, avatar: mockCloudinaryResult.secure_url };

      vi.mocked(saveFileToCloudinary).mockResolvedValue(mockCloudinaryResult);
      vi.mocked(User.findByIdAndUpdate).mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await updateUserAvatarUrl(mockUserId, mockFileBuffer);

      // Assert
      expect(saveFileToCloudinary).toHaveBeenCalledWith(mockFileBuffer);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { avatar: mockCloudinaryResult.secure_url },
        { new: true }
      );
      expect(result).toBe(mockCloudinaryResult.secure_url);
    });

    it('should throw if saveFileToCloudinary throws', async () => {
      // Arrange
      const mockUserId = 'user123';
      const mockFileBuffer = Buffer.from('test image data');
      const expectedError = new Error('Cloudinary error');

      vi.mocked(saveFileToCloudinary).mockRejectedValue(expectedError);

      // Act & Assert
      await expect(updateUserAvatarUrl(mockUserId, mockFileBuffer)).rejects.toThrow(expectedError);
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
});
