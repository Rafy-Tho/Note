import { validationError } from '../../common/errors.js';
import {
  assertObject,
  assertPagination,
  assertUuid,
} from '../../common/validation.js';

const NOTE_STATES = ['active', 'archived'];
const EMPTY_DOCUMENT = { type: 'doc', content: [] };

function assertTitle(title) {
  if (typeof title !== 'string' || title.length > 500)
    throw validationError({
      title: 'Must be text no longer than 500 characters.',
    });
}

function assertContentJson(contentJson) {
  if (
    !contentJson ||
    typeof contentJson !== 'object' ||
    Array.isArray(contentJson) ||
    contentJson.type !== 'doc'
  )
    throw validationError({ contentJson: 'Must be a valid document.' });

  if (JSON.stringify(contentJson).length > 1_000_000)
    throw validationError({ contentJson: 'Must be no larger than 1 MB.' });
}

export function validateNoteId(noteId) {
  assertUuid(noteId, 'noteId');
  return noteId;
}

export function validateNoteList(query) {
  const pagination = assertPagination(query);
  const fields = {};
  const state = query.state ?? 'active';

  if (!NOTE_STATES.includes(state))
    fields.state = 'Must be active or archived.';
  if (
    query.favorite !== undefined &&
    query.favorite !== 'true' &&
    query.favorite !== 'false'
  )
    fields.favorite = 'Must be true or false.';

  if (Object.keys(fields).length > 0) throw validationError(fields);
  return {
    ...pagination,
    state,
    favorite: query.favorite === undefined ? null : query.favorite === 'true',
  };
}

export function validateCreateNote(body) {
  assertObject(body);
  const title = body.title ?? '';
  const contentJson = body.contentJson ?? EMPTY_DOCUMENT;
  assertTitle(title);
  assertContentJson(contentJson);
  return { title, contentJson };
}

export function validateUpdateNote(body) {
  assertObject(body);
  const fields = {};
  const update = {};

  if (body.title !== undefined) {
    assertTitle(body.title);
    update.title = body.title;
  }
  if (body.contentJson !== undefined) {
    assertContentJson(body.contentJson);
    update.contentJson = body.contentJson;
  }
  if (Object.keys(update).length === 0)
    fields.body = 'Must include title or contentJson.';
  if (!Number.isInteger(body.revision) || body.revision < 0)
    fields.revision = 'Must be a non-negative integer.';
  if (Object.keys(fields).length > 0) throw validationError(fields);
  return { ...update, revision: body.revision };
}
