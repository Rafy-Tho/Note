import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../auth/api/authApi.js';
import { notesApi } from '../../notes/api/notesApi.js';
import { tagsApi } from '../../tags/api/tagsApi.js';
import { notebooksApi } from '../../notebooks/api/notebooksApi.js';
import { workspaceQueryKeys } from './useWorkspaceQueries.js';

export function useWorkspaceMutations() {
  const queryClient = useQueryClient();
  const refresh = (...keys) =>
    Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: key })));

  const createNote = useMutation({
    mutationFn: (note) => notesApi.create(note),
    onSuccess: () => refresh(workspaceQueryKeys.notes),
  });
  const updateNote = useMutation({
    mutationFn: ({ noteId, note }) => notesApi.update(noteId, note),
    onSuccess: () => refresh(workspaceQueryKeys.notes, workspaceQueryKeys.favorites),
  });
  const trashNote = useMutation({
    mutationFn: (noteId) => notesApi.trash(noteId),
    onSuccess: () => refresh(workspaceQueryKeys.notes, workspaceQueryKeys.trash),
  });
  const restoreNote = useMutation({
    mutationFn: (noteId) => notesApi.restore(noteId),
    onSuccess: () => refresh(workspaceQueryKeys.notes, workspaceQueryKeys.trash),
  });
  const permanentlyDelete = useMutation({
    mutationFn: (noteId) => notesApi.permanentlyDelete(noteId),
    onSuccess: () => refresh(workspaceQueryKeys.trash),
  });
  const favoriteNote = useMutation({
    mutationFn: ({ noteId, favorite }) =>
      favorite ? notesApi.favorite(noteId) : notesApi.unfavorite(noteId),
    onSuccess: () => refresh(workspaceQueryKeys.notes, workspaceQueryKeys.favorites),
  });
  const archiveNote = useMutation({
    mutationFn: ({ noteId, archived }) =>
      archived ? notesApi.unarchive(noteId) : notesApi.archive(noteId),
    onSuccess: () => refresh(workspaceQueryKeys.notes, workspaceQueryKeys.archive),
  });
  const assignNotebook = useMutation({
    mutationFn: ({ noteId, notebookId }) => notesApi.assignNotebook(noteId, notebookId),
    onSuccess: () => refresh(workspaceQueryKeys.notes),
  });
  const createNotebook = useMutation({
    mutationFn: (name) => notebooksApi.create(name),
    onSuccess: () => refresh(workspaceQueryKeys.notebooks),
  });
  const renameNotebook = useMutation({
    mutationFn: ({ notebookId, name }) => notebooksApi.rename(notebookId, name),
    onSuccess: () => refresh(workspaceQueryKeys.notebooks),
  });
  const deleteNotebook = useMutation({
    mutationFn: (notebookId) => notebooksApi.remove(notebookId),
    onSuccess: () => refresh(workspaceQueryKeys.notebooks, workspaceQueryKeys.notes),
  });
  const unlinkProvider = useMutation({
    mutationFn: (provider) => authApi.unlinkProvider(provider),
    onSuccess: () => refresh(workspaceQueryKeys.identities),
  });

  return {
    createNote,
    updateNote,
    trashNote,
    restoreNote,
    permanentlyDelete,
    favoriteNote,
    archiveNote,
    assignNotebook,
    createNotebook,
    renameNotebook,
    deleteNotebook,
    unlinkProvider,
  };
}
