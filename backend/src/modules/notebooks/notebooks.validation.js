import { validationError } from '../../common/errors/errors.js';
import {
  assertObject,
  assertPagination,
  assertUuid,
} from '../../common/validation/validation.js';

const NOTEBOOK_NAME_MAX_LENGTH = 200;

export function normalizeNotebookName(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name || name.length > NOTEBOOK_NAME_MAX_LENGTH) return null;
  return name;
}

export function validateNotebookId(notebookId) {
  assertUuid(notebookId, 'notebookId');
  return notebookId;
}

export function validateNotebookList(query) {
  return assertPagination(query);
}

export function validateCreateNotebook(body) {
  assertObject(body);
  const name = normalizeNotebookName(body.name);
  if (!name)
    throw validationError({
      name: `Must be between 1 and ${NOTEBOOK_NAME_MAX_LENGTH} characters.`,
    });
  return { name, normalizedName: name.toLowerCase() };
}

export const validateRenameNotebook = validateCreateNotebook;

export function validateNotebookAssignment(body) {
  assertObject(body);
  if (body.notebookId !== null && body.notebookId !== undefined)
    assertUuid(body.notebookId, 'notebookId');
  return { notebookId: body.notebookId ?? null };
}
