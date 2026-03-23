import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveFileToCloudinary } from '../src/utils/saveFileToCloudinary.js';
import { sendEmail } from '../src/utils/sendMail.js';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';
import { Readable } from 'node:stream';

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

describe('Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveFileToCloudinary', () => {
    it('should resolve with result on successful upload', async () => {
      const mockBuffer = Buffer.from('test');
      const mockResult = { secure_url: 'http://test.com/img.jpg' };
      
      const mockUploadStream = vi.fn((options, callback) => {
        // We simulate the stream finishing by immediately calling the callback
        process.nextTick(() => callback(null, mockResult));
        return {
          on: vi.fn(),
          once: vi.fn(),
          emit: vi.fn(),
          write: vi.fn(),
          end: vi.fn(),
        };   
      });

      vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(mockUploadStream);

      // We need to mock Readable.from to return something that has a pipe method
      const mockPipe = vi.fn();
      const originalFrom = Readable.from;
      Readable.from = vi.fn().mockReturnValue({ pipe: mockPipe });

      const promise = saveFileToCloudinary(mockBuffer);
      
      await expect(promise).resolves.toEqual(mockResult);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
      expect(Readable.from).toHaveBeenCalledWith(mockBuffer);
      expect(mockPipe).toHaveBeenCalled();

      // Restore
      Readable.from = originalFrom;
    });

    it('should reject with error on failed upload', async () => {
      const mockBuffer = Buffer.from('test');
      const mockError = new Error('upload failed');
      
      const mockUploadStream = vi.fn((options, callback) => {
        process.nextTick(() => callback(mockError, null));
        return {
          on: vi.fn(),
          once: vi.fn(),
          emit: vi.fn(),
          write: vi.fn(),
          end: vi.fn(),
        };   
      });

      vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(mockUploadStream);

      const mockPipe = vi.fn();
      const originalFrom = Readable.from;
      Readable.from = vi.fn().mockReturnValue({ pipe: mockPipe });

      const promise = saveFileToCloudinary(mockBuffer);
      
      await expect(promise).rejects.toThrow('upload failed');

      // Restore
      Readable.from = originalFrom;
    });
  });

  describe('sendEmail', () => {
    it('should create transport and send email', async () => {
      // In ES modules, the file evaluates at import time. 
      // The easiest way to test without complex vi.mock setups for module-level constants 
      // is to mock the underlying transporter.sendMail.
      const mockSendMail = vi.fn().mockResolvedValue('success');
      
      // Since nodemailer.createTransport was called on import, we need to mock what it returned.
      // We can use vi.mocked to redefine the behavior for this test if we mocked the entire nodemailer.
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      });

      // To make this work, we might need to strictly isolate or just re-import sendMail
      // after the mock is set. Let's use dynamic import.
      vi.resetModules();
      const { sendEmail } = await import('../src/utils/sendMail.js');

      const emailOptions = { to: 'test@test.com', subject: 'Test', html: '<p>Hi</p>' };
      
      await sendEmail(emailOptions);

      expect(nodemailer.createTransport).toHaveBeenCalled();
      
      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.to).toBe(emailOptions.to);
      expect(callArg.subject).toBe(emailOptions.subject);
      expect(callArg.html).toBe(emailOptions.html);
    });
  });
});
