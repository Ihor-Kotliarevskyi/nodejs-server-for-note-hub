import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as noteService from '../src/services/noteService.js';
import { Note } from '../src/models/note.js';

// Mock Mongoose model
vi.mock('../src/models/note.js', () => ({
  Note: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findOneAndDelete: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

describe('NoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllNotesList', () => {
    it('should return paginated notes list', async () => {
      // Arrange
      const mockUserId = 'user1';
      const mockNotes = [{ _id: 'note1' }, { _id: 'note2' }];
      
      const mockCountDocuments = vi.fn().mockResolvedValue(2);
      const mockLimit = vi.fn().mockResolvedValue(mockNotes);
      const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockClone = vi.fn().mockReturnValue({ countDocuments: mockCountDocuments });
      
      const queryMock = {
        clone: mockClone,
        skip: mockSkip,
        where: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(Note.find).mockReturnValue(queryMock);

      // Act
      const result = await noteService.getAllNotesList(mockUserId, { page: 1, perPage: 10 });

      // Assert
      expect(Note.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result).toEqual({
        page: 1,
        perPage: 10,
        totalNotes: 2,
        totalPages: 1,
        notes: mockNotes,
      });
    });

    it('should handle search and tag filters (array and primitive)', async () => {
      // Arrange
      const mockUserId = 'user1';
      const mockNotes = [];
      const mockCountDocuments = vi.fn().mockResolvedValue(0);
      const mockLimit = vi.fn().mockResolvedValue(mockNotes);
      const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockClone = vi.fn().mockReturnValue({ countDocuments: mockCountDocuments });
      
      const inMock = vi.fn().mockReturnThis();
      const whereMock = vi.fn().mockImplementation((field) => {
        if (field === 'tag') return { in: inMock };
        return queryMock; // for standard where
      });

      const queryMock = {
        clone: mockClone,
        skip: mockSkip,
        where: whereMock,
      };
      
      vi.mocked(Note.find).mockReturnValue(queryMock);

      // Act 1: primitive tag
      await noteService.getAllNotesList(mockUserId, { search: 'query', tag: 'Todo' });
      expect(whereMock).toHaveBeenCalledWith({ $text: { $search: 'query' } });
      expect(whereMock).toHaveBeenCalledWith('tag');
      expect(inMock).toHaveBeenCalledWith(['Todo']);

      // Act 2: array tag
      vi.clearAllMocks();
      vi.mocked(Note.find).mockReturnValue(queryMock);
      await noteService.getAllNotesList(mockUserId, { tag: ['Todo', 'Done'] });
      expect(inMock).toHaveBeenCalledWith(['Todo', 'Done']);
    });
  });

  describe('getNote', () => {
    it('should return a single note by id', async () => {
      // Arrange
      const mockNoteId = 'note123';
      const mockUserId = 'user1';
      const mockNote = { _id: mockNoteId, title: 'Test' };

      vi.mocked(Note.findOne).mockResolvedValue(mockNote);

      // Act
      const result = await noteService.getNote(mockNoteId, mockUserId);

      // Assert
      expect(Note.findOne).toHaveBeenCalledWith({ _id: mockNoteId, userId: mockUserId });
      expect(result).toEqual(mockNote);
    });
  });

  describe('createNoteModel', () => {
    it('should create a note with default values for content and tag if omitted', async () => {
      // Arrange
      const mockUserId = 'user1';
      const payload = { title: 'New Note' };
      const createdNote = { _id: 'note123', ...payload, content: '', tag: 'Todo', userId: mockUserId };

      vi.mocked(Note.create).mockResolvedValue(createdNote);

      // Act
      const result = await noteService.createNoteModel(mockUserId, payload);

      // Assert
      expect(Note.create).toHaveBeenCalledWith({
        title: 'New Note',
        content: '',
        tag: 'Todo',
        userId: mockUserId,
      });
      expect(result).toEqual(createdNote);
    });

    it('should assign provided content and tag', async () => {
      const mockUserId = 'user1';
      const payload = { title: 'Title', content: 'C', tag: 'Done' };
      vi.mocked(Note.create).mockResolvedValue(payload);

      await noteService.createNoteModel(mockUserId, payload);

      expect(Note.create).toHaveBeenCalledWith({
        title: 'Title',
        content: 'C',
        tag: 'Done',
        userId: mockUserId,
      });
    });
  });

  describe('deleteNoteModel', () => {
    it('should delete a note and return it', async () => {
      // Arrange
      const mockNoteId = 'note123';
      const mockUserId = 'user1';
      const deletedNote = { _id: mockNoteId, title: 'Test' };

      vi.mocked(Note.findOneAndDelete).mockResolvedValue(deletedNote);

      // Act
      const result = await noteService.deleteNoteModel(mockNoteId, mockUserId);

      // Assert
      expect(Note.findOneAndDelete).toHaveBeenCalledWith({ _id: mockNoteId, userId: mockUserId });
      expect(result).toEqual(deletedNote);
    });
  });

  describe('updateNoteModel', () => {
    it('should dynamically build update object based on provided payload', async () => {
      // Arrange
      const mockNoteId = 'note123';
      const mockUserId = 'user1';
      const payload = { title: 'T', content: 'C', tag: 'D' };
      const updatedNote = { _id: mockNoteId, title: 'Updated Title' };

      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(updatedNote);

      // Act
      const result = await noteService.updateNoteModel(mockNoteId, mockUserId, payload);

      // Assert
      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockNoteId, userId: mockUserId },
        { title: 'T', content: 'C', tag: 'D' },
        { new: true, runValidators: true }
      );
      expect(result).toEqual(updatedNote);
    });
  });
});

