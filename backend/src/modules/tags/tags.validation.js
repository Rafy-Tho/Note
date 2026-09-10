import { validationError } from '../../common/errors/errors.js';
import {
  assertObject,
  assertPagination,
  assertUuid,
} from '../../common/validation/validation.js';

const TAG_NAME_MAX_LENGTH = 100;

export function normalizeTagName(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name || name.length > TAG_NAME_MAX_LENGTH) return null;
  return name;
}

export function validateTagId(tagId) {
  assertUuid(tagId, 'tagId');
  return tagId;
}

export function validateNoteId(noteId) {
  assertUuid(noteId, 'noteId');
  return noteId;
}

export function validateTagList(query) {
  return assertPagination(query);
}

export function validateCreateTag(body) {
  assertObject(body);
  const name = normalizeTagName(body.name);
  if (!name)
    throw validationError({
      name: `Must be between 1 and ${TAG_NAME_MAX_LENGTH} characters.`,
    });
  return { name, normalizedName: name.toLowerCase() };
}

export function validateRenameTag(body) {
  return validateCreateTag(body);
}

export function validateAssignTag(body) {
  assertObject(body);
  if (body.tagId === undefined)
    throw validationError({ tagId: 'Must be provided.' });
  assertUuid(body.tagId, 'tagId');
  return { tagId: body.tagId };
}
