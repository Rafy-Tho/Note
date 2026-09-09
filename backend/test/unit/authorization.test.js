import { describe, expect, it } from 'vitest';
import {
  assertAllowedState,
  assertOwnedRelationship,
  assertOwnedResource,
  createOwnedResourceLoader,
  getAuthenticatedUserId,
  assertNoteState,
} from '../../src/modules/authorization/authorization.js';

describe('authorization helpers', () => {
  it('requires an authenticated user context', () => {
    expect(() => getAuthenticatedUserId({})).toThrow(
      'Authentication is required.',
    );
    expect(getAuthenticatedUserId({ auth: { userId: 'user-a' } })).toBe('user-a');
  });

  it('allows owned resources and hides missing or foreign resources', () => {
    const note = { id: 'note-1', user_id: 'user-a' };

    expect(assertOwnedResource(note, 'user-a')).toBe(note);
    expect(() => assertOwnedResource(null, 'user-a')).toThrow(
      'The requested resource was not found.',
    );
    expect(() => assertOwnedResource(note, 'user-b')).toThrow(
      'The requested resource was not found.',
    );
  });

  it('requires every resource in a relationship to share the owner', () => {
    const note = { user_id: 'user-a' };
    const notebook = { user_id: 'user-a' };
    const foreignTag = { user_id: 'user-b' };

    expect(assertOwnedRelationship([note, notebook], 'user-a')).toEqual([
      note,
      notebook,
    ]);
    expect(() => assertOwnedRelationship([note, foreignTag], 'user-a')).toThrow(
      'The requested resource was not found.',
    );
  });

  it('passes the owner into resource loading and safely rejects foreign data', async () => {
    const load = async (id, userId) =>
      id === 'note-1' && userId === 'user-a'
        ? { id, user_id: userId }
        : null;
    const loadOwnedNote = createOwnedResourceLoader(load);

    await expect(loadOwnedNote('note-1', 'user-a')).resolves.toEqual({
      id: 'note-1',
      user_id: 'user-a',
    });
    await expect(loadOwnedNote('note-1', 'user-b')).rejects.toThrow(
      'The requested resource was not found.',
    );
  });

  it('enforces note state transition rules without exposing resource details', () => {
    expect(() => assertNoteState('edit', 'active')).not.toThrow();
    expect(() => assertNoteState('archive', 'trashed')).toThrow(
      'The resource is not available for this operation.',
    );
    expect(() => assertAllowedState('active', ['active', 'archived'])).not.toThrow();
  });
});
