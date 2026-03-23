import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as notesController from '../src/controllers/notesController.js';
import * as noteService from '../src/services/noteService.js';
import createHttpError from 'http-errors';

vi.mock('../src/services/noteService.js', () => ({
  getAllNotesList: vi.fn(),
  getNote: vi.fn(),
  createNoteModel: vi.fn(),
  deleteNoteModel: vi.fn(),
  updateNoteModel: vi.fn(),
}));

describe('NotesController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      user: { _id: 'user123' },
      query: {},
      params: { noteId: 'note1' },
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('getAllNotes', () => {
    it('should return paginated notes via noteService', async () => {
      mockReq.query = { page: 2, perPage: 5 };
      const mockResult = { page: 2, perPage: 5, notes: [] };

      vi.mocked(noteService.getAllNotesList).mockResolvedValue(mockResult);

      await notesController.getAllNotes(mockReq, mockRes);

      expect(noteService.getAllNotesList).toHaveBeenCalledWith('user123', mockReq.query);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getNoteById', () => {
    it('should throw 404 if note not found', async () => {
      vi.mocked(noteService.getNote).mockResolvedValue(null);

      await expect(notesController.getNoteById(mockReq, mockRes))
        .rejects.toThrow('Note not found');
    });

    it('should return note if found', async () => {
      const mockNote = { _id: 'note1', title: 'Test' };
      vi.mocked(noteService.getNote).mockResolvedValue(mockNote);

      await notesController.getNoteById(mockReq, mockRes);

      expect(noteService.getNote).toHaveBeenCalledWith('note1', 'user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockNote);
    });
  });

  describe('createNote', () => {
    it('should create note via noteService and return it', async () => {
      mockReq.body = { title: 'New Note' };
      const createdNote = { _id: 'note2', title: 'New Note' };
      
      vi.mocked(noteService.createNoteModel).mockResolvedValue(createdNote);

      await notesController.createNote(mockReq, mockRes);

      expect(noteService.createNoteModel).toHaveBeenCalledWith('user123', mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdNote);
    });
  });

  describe('deleteNote', () => {
    it('should throw 404 if note not found on delete', async () => {
      vi.mocked(noteService.deleteNoteModel).mockResolvedValue(null);

      await expect(notesController.deleteNote(mockReq, mockRes))
        .rejects.toThrow('Note not found');
    });

    it('should return deleted note on success', async () => {
      const deletedNote = { _id: 'note1' };
      vi.mocked(noteService.deleteNoteModel).mockResolvedValue(deletedNote);

      await notesController.deleteNote(mockReq, mockRes);

      expect(noteService.deleteNoteModel).toHaveBeenCalledWith('note1', 'user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(deletedNote);
    });
  });

  describe('updateNote', () => {
    it('should throw 404 if note not found on update', async () => {
      mockReq.body = { title: 'T' };
      vi.mocked(noteService.updateNoteModel).mockResolvedValue(null);

      await expect(notesController.updateNote(mockReq, mockRes))
        .rejects.toThrow('Note not found');
    });

    it('should return updated note on success', async () => {
      mockReq.body = { title: 'T' };
      const updatedNote = { _id: 'note1', title: 'T' };
      
      vi.mocked(noteService.updateNoteModel).mockResolvedValue(updatedNote);

      await notesController.updateNote(mockReq, mockRes);

      expect(noteService.updateNoteModel).toHaveBeenCalledWith('note1', 'user123', mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedNote);
    });
  });
});
