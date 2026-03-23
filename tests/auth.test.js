import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../src/services/auth.js';
import { Session } from '../src/models/session.js';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../src/models/session.js', () => ({
  Session: {
    create: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createSession', () => {
    it('should generate tokens and create a new session', async () => {
      // Arrange
      const mockUserId = 'user123';
      const mockSession = { _id: 'session1', userId: mockUserId };
      vi.mocked(Session.create).mockResolvedValue(mockSession);
      
      const fixedDate = new Date('2024-01-01T12:00:00.000Z');
      vi.setSystemTime(fixedDate);

      // Act
      const result = await authService.createSession(mockUserId);

      // Assert
      expect(Session.create).toHaveBeenCalled();
      
      const createCallArgs = vi.mocked(Session.create).mock.calls[0][0];
      expect(createCallArgs.userId).toBe(mockUserId);
      expect(typeof createCallArgs.accessToken).toBe('string');
      expect(typeof createCallArgs.refreshToken).toBe('string');
      
      // Check expiration dates
      const fifteenMinutes = 15 * 60 * 1000;
      const oneDay = 24 * 60 * 60 * 1000;
      expect(createCallArgs.accessTokenValidUntil.getTime()).toBe(fixedDate.getTime() + fifteenMinutes);
      expect(createCallArgs.refreshTokenValidUntil.getTime()).toBe(fixedDate.getTime() + oneDay);
      
      expect(result).toEqual(mockSession);
    });
  });

  describe('setSessionCookies', () => {
    it('should set all session cookies correctly', () => {
      // Arrange
      const mockRes = {
        cookie: vi.fn(),
      };
      const mockSession = {
        _id: 'session123',
        accessToken: 'access-token-string',
        refreshToken: 'refresh-token-string',
      };

      // Set environment to something non-production for this test
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      authService.setSessionCookies(mockRes, mockSession);

      // Assert
      expect(mockRes.cookie).toHaveBeenCalledTimes(3);

      const expectedOptions = {
        httpOnly: true,
        secure: false, // Because not in production
        sameSite: 'lax',
        maxAge: undefined,
      };

      const fifteenMinutes = 15 * 60 * 1000;
      const oneDay = 24 * 60 * 60 * 1000;

      expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', mockSession.accessToken, {
        ...expectedOptions,
        maxAge: fifteenMinutes,
      });

      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', mockSession.refreshToken, {
        ...expectedOptions,
        maxAge: oneDay,
      });

      expect(mockRes.cookie).toHaveBeenCalledWith('sessionId', mockSession._id, {
        ...expectedOptions,
        maxAge: oneDay,
      });

      // Restore env
      process.env.NODE_ENV = originalEnv;
    });

    it('should use production cookie options when in production', () => {
      // Arrange
      const mockRes = { cookie: vi.fn() };
      const mockSession = { _id: 's', accessToken: 'a', refreshToken: 'r' };
      
      const originalEnv = process.env.NODE_ENV;
      
      // Need to re-import or simulate since isProduction is evaluated on module load.
      // Easiest is to accept it uses whatever it evaluated to when `auth.js` was first loaded.
      // But we can reset modules to force re-evaluation.
      vi.resetModules();
      process.env.NODE_ENV = 'production';
      
      return import('../src/services/auth.js').then((module) => {
        // Act
        module.setSessionCookies(mockRes, mockSession);

        // Assert
        const cookieCallOptions = mockRes.cookie.mock.calls[0][2];
        expect(cookieCallOptions.secure).toBe(true);
        expect(cookieCallOptions.sameSite).toBe('none');

        // Restore env
        process.env.NODE_ENV = originalEnv;
      });
    });
  });
});
