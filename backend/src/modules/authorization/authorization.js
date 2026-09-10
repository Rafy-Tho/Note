import {
  authenticationRequiredError,
  notFoundError,
  AppError,
} from '../../common/errors/errors.js';

const INVALID_STATE_MESSAGE =
  'The resource is not available for this operation.';

export const NOTE_OPERATION_STATES = Object.freeze({
  archive: ['active'],
  unarchive: ['archived'],
  trash: ['active', 'archived'],
  restore: ['trashed'],
  permanentDelete: ['trashed'],
  favorite: ['active', 'archived'],
  edit: ['active', 'archived'],
});

export function getAuthenticatedUserId(request) {
  const userId = request.auth?.userId;
  if (!userId) throw authenticationRequiredError();
  return userId;
}

export function assertOwnedResource(resource, userId) {
  if (!resource || resource.user_id !== userId) throw notFoundError();
  return resource;
}

export function assertOwnedRelationship(resources, userId) {
  if (
    !Array.isArray(resources) ||
    resources.length === 0 ||
    resources.some((resource) => !resource || resource.user_id !== userId)
  )
    throw notFoundError();

  return resources;
}

export function assertAllowedState(state, allowedStates) {
  if (!allowedStates.includes(state)) {
    throw new AppError(409, 'INVALID_STATE_TRANSITION', INVALID_STATE_MESSAGE);
  }
}

export function assertNoteState(operation, state) {
  const allowedStates = NOTE_OPERATION_STATES[operation];
  if (!allowedStates)
    throw new AppError(
      500,
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred.',
    );
  assertAllowedState(state, allowedStates);
}

export function createOwnedResourceLoader(load) {
  return async (resourceId, userId) => {
    const resource = await load(resourceId, userId);
    return assertOwnedResource(resource, userId);
  };
}
