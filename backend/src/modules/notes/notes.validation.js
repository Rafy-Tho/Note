import { URL } from 'node:url';
import { validationError } from '../../common/errors/errors.js';
import {
  assertObject,
  assertPagination,
  assertUuid,
} from '../../common/validation/validation.js';

const NOTE_STATES = ['active', 'archived'];
const EMPTY_DOCUMENT = { type: 'doc', content: [] };
const MAX_DOCUMENT_DEPTH = 100;
const MAX_DOCUMENT_NODES = 10_000;
const MAX_TEXT_LENGTH = 100_000;

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

  const fields = {};
  const allowedMarks = new Set(['bold', 'italic', 'code', 'link']);
  const allowedNodes = new Set([
    'doc',
    'paragraph',
    'heading',
    'text',
    'bulletList',
    'orderedList',
    'listItem',
    'codeBlock',
  ]);
  const allowedNodeAttrs = new Map([
    ['doc', new Set()],
    ['paragraph', new Set()],
    ['heading', new Set(['level'])],
    ['text', new Set()],
    ['bulletList', new Set()],
    ['orderedList', new Set(['start'])],
    ['listItem', new Set()],
    ['codeBlock', new Set(['language'])],
  ]);
  let nodeCount = 0;
  let textLength = 0;

  function visit(node, parentType = null, depth = 0) {
    nodeCount += 1;
    if (nodeCount > MAX_DOCUMENT_NODES || depth > MAX_DOCUMENT_DEPTH) {
      fields.contentJson = 'Contains too many nested document nodes.';
      return;
    }
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      fields.contentJson = 'Contains an invalid document node.';
      return;
    }
    if (!allowedNodes.has(node.type)) {
      fields.contentJson = 'Contains an unsupported document node.';
      return;
    }
    if (node.attrs !== undefined) {
      if (
        !node.attrs ||
        typeof node.attrs !== 'object' ||
        Array.isArray(node.attrs)
      ) {
        fields.contentJson = 'Contains invalid node attributes.';
        return;
      }
      const allowedAttrs = allowedNodeAttrs.get(node.type);
      if (
        [...Object.keys(node.attrs)].some(
          (attribute) => !allowedAttrs.has(attribute),
        )
      ) {
        fields.contentJson = 'Contains unsupported node attributes.';
        return;
      }
    }
    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks)) {
        fields.contentJson = 'Contains invalid text formatting.';
        return;
      }
      for (const mark of node.marks) {
        if (!mark || !allowedMarks.has(mark.type)) {
          fields.contentJson = 'Contains unsupported text formatting.';
          return;
        }
        if (mark.type !== 'link' && mark.attrs !== undefined) {
          fields.contentJson = 'Contains unsupported text formatting.';
          return;
        }
        if (mark.type === 'link') {
          if (
            !mark.attrs ||
            typeof mark.attrs !== 'object' ||
            Array.isArray(mark.attrs) ||
            Object.keys(mark.attrs).some((attribute) => attribute !== 'href')
          ) {
            fields.contentJson = 'Contains an unsafe link.';
            return;
          }
          const href = mark.attrs?.href;
          if (
            typeof href !== 'string' ||
            !/^(https?:|mailto:)/i.test(href) ||
            Array.from(href).some((character) => character.charCodeAt(0) < 32)
          ) {
            fields.contentJson = 'Contains an unsafe link.';
            return;
          }
          try {
            const parsed = new URL(href);
            if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
              fields.contentJson = 'Contains an unsafe link.';
              return;
            }
          } catch {
            fields.contentJson = 'Contains an unsafe link.';
            return;
          }
        }
      }
    }
    if (node.type === 'text' && typeof node.text !== 'string') {
      fields.contentJson = 'Contains invalid text content.';
      return;
    }
    if (node.type === 'text') {
      textLength += node.text.length;
      if (textLength > MAX_TEXT_LENGTH) {
        fields.contentJson = 'Contains too much text.';
        return;
      }
    }
    if (node.type === 'heading') {
      if (
        !Number.isInteger(node.attrs?.level) ||
        node.attrs.level < 1 ||
        node.attrs.level > 3
      ) {
        fields.contentJson = 'Headings must use levels 1 through 3.';
        return;
      }
    }
    if (
      node.type === 'orderedList' &&
      node.attrs?.start !== undefined &&
      !Number.isInteger(node.attrs.start)
    ) {
      fields.contentJson = 'Contains an invalid ordered list.';
      return;
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) {
        fields.contentJson = 'Contains invalid child nodes.';
        return;
      }
      node.content.forEach((child) => visit(child, node.type, depth + 1));
    }
    if (node.type === 'text' && parentType === 'doc') {
      fields.contentJson = 'Text must be inside a text block.';
    }
  }

  visit(contentJson);
  if (Object.keys(fields).length > 0) throw validationError(fields);
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
  if (query.notebookId !== undefined) {
    try {
      assertUuid(query.notebookId, 'notebookId');
    } catch (error) {
      fields.notebookId = error.fields?.notebookId ?? 'Must be a valid UUID.';
    }
  }

  if (Object.keys(fields).length > 0) throw validationError(fields);
  return {
    ...pagination,
    state,
    favorite: query.favorite === undefined ? null : query.favorite === 'true',
    notebookId: query.notebookId ?? null,
  };
}

export function validateTrashList(query) {
  return assertPagination(query);
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
