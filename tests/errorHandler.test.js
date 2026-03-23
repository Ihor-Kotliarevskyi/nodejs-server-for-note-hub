import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../src/middleware/errorHandler.js';
import createHttpError from 'http-errors';

describe('ErrorHandler Middleware', () => {
  let mockReq, mockRes, mockNext;
  const originalConsoleError = console.error;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    console.error = vi.fn(); // suppress logs in test output
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should handle HttpError and return custom status/message', () => {
    const error = createHttpError(404, 'Not found item');
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not found item' });
  });

  it('should handle generic Error in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Database connection failed');
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Database connection failed' });

    process.env.NODE_ENV = originalEnv;
  });

  it('should hide error details in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Secret credentials leaked');
    
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Something went wrong. Please try again later.' });

    process.env.NODE_ENV = originalEnv;
  });
});
