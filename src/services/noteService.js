import { Note } from '../models/note.js';

export const getAllNotesList = async (userId, { page = 1, perPage = 15, search, tag } = {}) => {
  const skip = (page - 1) * perPage;

  const notesQuery = Note.find({ userId });

  if (search) {
    notesQuery.where({ $text: { $search: search } });
  }

  if (tag) {
    notesQuery.where('tag').in(Array.isArray(tag) ? tag : [tag]);
  }

  const [totalNotes, notes] = await Promise.all([
    notesQuery.clone().countDocuments(),
    notesQuery.skip(skip).limit(perPage),
  ]);

  const totalPages = Math.ceil(totalNotes / perPage);

  return {
    page: Number(page),
    perPage: Number(perPage),
    totalNotes,
    totalPages,
    notes,
  };
};

export const getNote = async (noteId, userId) => {
  return Note.findOne({ _id: noteId, userId });
};

export const createNoteModel = async (userId, payload) => {
  return Note.create({
    title: payload.title,
    content: payload.content ?? '',
    tag: payload.tag ?? 'Todo',
    userId,
  });
};

export const deleteNoteModel = async (noteId, userId) => {
  return Note.findOneAndDelete({
    _id: noteId,
    userId,
  });
};

export const updateNoteModel = async (noteId, userId, payload) => {
  const update = {};
  if (payload.title !== undefined) update.title = payload.title;
  if (payload.content !== undefined) update.content = payload.content;
  if (payload.tag !== undefined) update.tag = payload.tag;

  return Note.findOneAndUpdate(
    { _id: noteId, userId },
    update,
    { new: true, runValidators: true },
  );
};
