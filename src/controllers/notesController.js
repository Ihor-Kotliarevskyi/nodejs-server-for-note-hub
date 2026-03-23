import createHttpError from 'http-errors';
import * as noteService from '../services/noteService.js';

export const getAllNotes = async (req, res) => {
  const result = await noteService.getAllNotesList(req.user._id, req.query);
  res.status(200).json(result);
};

export const getNoteById = async (req, res) => {
  const note = await noteService.getNote(req.params.noteId, req.user._id);

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};

export const createNote = async (req, res) => {
  const note = await noteService.createNoteModel(req.user._id, req.body);
  res.status(201).json(note);
};

export const deleteNote = async (req, res) => {
  const note = await noteService.deleteNoteModel(req.params.noteId, req.user._id);

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};

export const updateNote = async (req, res) => {
  const note = await noteService.updateNoteModel(
    req.params.noteId,
    req.user._id,
    req.body,
  );

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};
