import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

export const getAllNotes = async (req, res) => {
  const { page = 1, perPage = 15, search, tag } = req.query;
  const skip = (page - 1) * perPage;

  const notesQuery = Note.find({ userId: req.user._id });

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

  res.status(200).json({
    page,
    perPage,
    totalNotes,
    totalPages,
    notes,
  });
};

export const getNoteById = async (req, res) => {
  const { noteId } = req.params;
  const note = await Note.findOne({ _id: noteId, userId: req.user._id });

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};

export const createNote = async (req, res) => {
  const { title, content, tag } = req.body;
  const note = await Note.create({
    title,
    content: content ?? '',
    tag: tag ?? 'Todo',
    userId: req.user._id,
  });
  res.status(201).json(note);
};

export const deleteNote = async (req, res) => {
  const { noteId } = req.params;
  const note = await Note.findOneAndDelete({
    _id: noteId,
    userId: req.user._id,
  });

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};

export const updateNote = async (req, res) => {
  const { noteId } = req.params;
  const update = {};
  if (req.body.title !== undefined) update.title = req.body.title;
  if (req.body.content !== undefined) update.content = req.body.content;
  if (req.body.tag !== undefined) update.tag = req.body.tag;

  const note = await Note.findOneAndUpdate(
    { _id: noteId, userId: req.user._id },
    update,
    { new: true, runValidators: true },
  );

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};
