import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authController from '../src/controllers/authController.js';
import { User } from '../src/models/user.js';
import * as authService from '../src/services/auth.js';
import { Session } from '../src/models/session.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('../src/models/user.js', () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
  },
}));

vi.mock('../src/models/session.js', () => ({
  Session: {
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('../src/services/auth.js', () => ({
  createSession: vi.fn(),
  setSessionCookies: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('AuthController', () => {
  let mockReq;
  let mockRes;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, JWT_SECRET: 'test_secret', FRONTEND_DOMAIN: 'test.com', SMTP_FROM: 'noreply@test.com' };
    mockReq = {
      body: {},
      cookies: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      clearCookie: vi.fn(),
      send: vi.fn(),
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('registerUser', () => {
    it('should throw HTTP 400 if user exists', async () => {
      mockReq.body = { email: 'test@test.com', password: 'pass' };
      vi.mocked(User.findOne).mockResolvedValue({ _id: '1' });

      await expect(authController.registerUser(mockReq, mockRes))
        .rejects.toThrow(/Email in use/);
    });

    it('should hash password, create user and setup session', async () => {
      mockReq.body = { email: 'new@test.com', password: 'password123' };
      const newUser = { _id: 'user2', email: 'new@test.com' };
      const mockSession = { _id: 'sess2' };

      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password');
      vi.mocked(User.create).mockResolvedValue(newUser);
      vi.mocked(authService.createSession).mockResolvedValue(mockSession);

      await authController.registerUser(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(User.create).toHaveBeenCalledWith({ email: 'new@test.com', password: 'hashed_password' });
      expect(authService.createSession).toHaveBeenCalledWith(newUser._id);
      expect(authService.setSessionCookies).toHaveBeenCalledWith(mockRes, mockSession);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(newUser);
    });
  });

  describe('loginUser', () => {
    it('should throw 401 on invalid email', async () => {
      mockReq.body = { email: 'w@w.com', password: 'p' };
      vi.mocked(User.findOne).mockResolvedValue(null);
      await expect(authController.loginUser(mockReq, mockRes)).rejects.toThrow('Invalid credentials');
    });

    it('should throw 401 on invalid password', async () => {
      mockReq.body = { email: 'test@test.com', password: 'wrong' };
      vi.mocked(User.findOne).mockResolvedValue({ _id: 'u1', password: 'hashed' });
      vi.mocked(bcrypt.compare).mockResolvedValue(false);
      await expect(authController.loginUser(mockReq, mockRes)).rejects.toThrow('Invalid credentials');
    });

    it('should login, delete old session, and create new one', async () => {
      mockReq.body = { email: 't@t.com', password: 'pass' };
      const mockUser = { _id: 'u1', password: 'hashed' };
      const newSession = { _id: 'new_session' };

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(Session.deleteOne).mockResolvedValue({});
      vi.mocked(authService.createSession).mockResolvedValue(newSession);

      await authController.loginUser(mockReq, mockRes);

      expect(Session.deleteOne).toHaveBeenCalledWith({ userId: mockUser._id });
      expect(authService.createSession).toHaveBeenCalledWith(mockUser._id);
      expect(authService.setSessionCookies).toHaveBeenCalledWith(mockRes, newSession);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('logoutUser', () => {
    it('should delete session and clear cookies', async () => {
      mockReq.cookies = { sessionId: 'sess123' };
      vi.mocked(Session.deleteOne).mockResolvedValue({});

      await authController.logoutUser(mockReq, mockRes);

      expect(Session.deleteOne).toHaveBeenCalledWith({ _id: 'sess123' });
      expect(mockRes.clearCookie).toHaveBeenCalledWith('sessionId');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('refreshUserSession', () => {
    it('should throw 401 if session is not found', async () => {
      mockReq.cookies = { sessionId: 's1', refreshToken: 'r1' };
      vi.mocked(Session.findOne).mockResolvedValue(null);
      await expect(authController.refreshUserSession(mockReq, mockRes)).rejects.toThrow('Session not found');
    });

    it('should throw 401 if refresh token is expired', async () => {
      mockReq.cookies = { sessionId: 's1', refreshToken: 'r1' };
      vi.mocked(Session.findOne).mockResolvedValue({ refreshTokenValidUntil: new Date(Date.now() - 10000) });
      await expect(authController.refreshUserSession(mockReq, mockRes)).rejects.toThrow('Session token expired');
    });

    it('should recreate session on valid refresh token', async () => {
      mockReq.cookies = { sessionId: 's1', refreshToken: 'r1' };
      const mockSession = { userId: 'u1', refreshTokenValidUntil: new Date(Date.now() + 10000) };
      const newSession = { _id: 's2' };

      vi.mocked(Session.findOne).mockResolvedValue(mockSession);
      vi.mocked(Session.deleteOne).mockResolvedValue({});
      vi.mocked(authService.createSession).mockResolvedValue(newSession);

      await authController.refreshUserSession(mockReq, mockRes);

      expect(Session.deleteOne).toHaveBeenCalledWith({ _id: 's1', refreshToken: 'r1' });
      expect(authService.createSession).toHaveBeenCalledWith('u1');
      expect(authService.setSessionCookies).toHaveBeenCalledWith(mockRes, newSession);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('requestResetEmail', () => {
    it('should return 200 without sending email if user not found', async () => {
      mockReq.body = { email: 'notfound@test.com' };
      vi.mocked(User.findOne).mockResolvedValue(null);
      
      await authController.requestResetEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('resetPassword', () => {
    it('should throw 404 if user not found from token payload', async () => {
      mockReq.body = { password: 'newpass', token: 'validtoken' };
      vi.mocked(jwt.verify).mockReturnValue({ sub: 'u1', email: 'e' });
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(authController.resetPassword(mockReq, mockRes)).rejects.toThrow('User not found');
    });

    it('should update password and delete all sessions', async () => {
      mockReq.body = { password: 'newpass', token: 'validtoken' };
      const mockUser = { _id: 'u1', email: 'e' };

      vi.mocked(jwt.verify).mockReturnValue({ sub: 'u1', email: 'e' });
      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.hash).mockResolvedValue('newhashedpass');
      vi.mocked(User.updateOne).mockResolvedValue({});
      vi.mocked(Session.deleteMany).mockResolvedValue({});

      await authController.resetPassword(mockReq, mockRes);

      expect(User.updateOne).toHaveBeenCalledWith({ _id: 'u1' }, { password: 'newhashedpass' });
      expect(Session.deleteMany).toHaveBeenCalledWith({ userId: 'u1' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});

