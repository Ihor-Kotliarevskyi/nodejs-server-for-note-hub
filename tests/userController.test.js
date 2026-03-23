import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUserAvatar } from '../src/controllers/userController.js';
import * as userService from '../src/services/userService.js';
import createHttpError from 'http-errors';

vi.mock('../src/services/userService.js', () => ({
  updateUserAvatarUrl: vi.fn(),
}));

describe('UserController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      user: { _id: 'user123' },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('updateUserAvatar', () => {
    it('should throw 400 if no file is provided', async () => {
      // req.file is undefined
      await expect(updateUserAvatar(mockReq, mockRes))
        .rejects.toThrow('No file');
    });

    it('should call userService and send avatar url on success', async () => {
      mockReq.file = { buffer: Buffer.from('img') };
      const expectedUrl = 'http://test.com/img.jpg';
      
      vi.mocked(userService.updateUserAvatarUrl).mockResolvedValue(expectedUrl);

      await updateUserAvatar(mockReq, mockRes);

      expect(userService.updateUserAvatarUrl).toHaveBeenCalledWith('user123', mockReq.file.buffer);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ url: expectedUrl });
    });
  });
});
