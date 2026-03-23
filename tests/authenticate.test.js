import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '../src/middleware/authenticate.js';
import { Session } from '../src/models/session.js';
import { User } from '../src/models/user.js';
import createHttpError from 'http-errors';

vi.mock('../src/models/session.js', () => ({
  Session: {
    findOne: vi.fn(),
  },
}));

vi.mock('../src/models/user.js', () => ({
  User: {
    findById: vi.fn(),
  },
}));

describe('Authenticate Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      cookies: {},
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  it('should throw 401 if access token is missing', async () => {
    await expect(authenticate(mockReq, mockRes, mockNext))
      .rejects.toThrow('Missing access token');
  });

  it('should throw 401 if session is not found', async () => {
    mockReq.cookies.accessToken = 'valid_token';
    vi.mocked(Session.findOne).mockResolvedValue(null);

    await expect(authenticate(mockReq, mockRes, mockNext))
      .rejects.toThrow('Session not found');
  });

  it('should throw 401 if access token is expired', async () => {
    mockReq.cookies.accessToken = 'valid_token';
    const pastDate = new Date(Date.now() - 10000); // 10 seconds ago
    
    vi.mocked(Session.findOne).mockResolvedValue({
      accessTokenValidUntil: pastDate,
    });

    await expect(authenticate(mockReq, mockRes, mockNext))
      .rejects.toThrow('Access token expired');
  });

  it('should throw 401 if user is not found', async () => {
    mockReq.cookies.accessToken = 'valid_token';
    const futureDate = new Date(Date.now() + 10000);
    
    vi.mocked(Session.findOne).mockResolvedValue({
      accessTokenValidUntil: futureDate,
      userId: 'user123',
    });
    vi.mocked(User.findById).mockResolvedValue(null);

    await expect(authenticate(mockReq, mockRes, mockNext))
      .rejects.toThrow('Unauthorized');
  });

  it('should attach user to req and call next if completely valid', async () => {
    mockReq.cookies.accessToken = 'valid_token';
    const futureDate = new Date(Date.now() + 10000);
    const mockUser = { _id: 'user123', name: 'Test' };
    
    vi.mocked(Session.findOne).mockResolvedValue({
      accessTokenValidUntil: futureDate,
      userId: 'user123',
    });
    vi.mocked(User.findById).mockResolvedValue(mockUser);

    await authenticate(mockReq, mockRes, mockNext);

    expect(mockReq.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
