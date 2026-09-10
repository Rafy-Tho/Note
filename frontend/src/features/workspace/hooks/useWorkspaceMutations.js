import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../auth/services/authApi.js';
import { notesApi } from '../../notes/services/notesApi.js';
import { tagsApi } from '../../tags/services/tagsApi.js';
import { notebooksApi } from '../../notebooks/services/notebooksApi.js';
import { workspaceQueryKeys } from './useWorkspaceQueries.js';

export function useWorkspaceMutations() {
  const queryClient = useQueryClient();
  const refresh = (...keys) =>
    Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
  const updateInfiniteNotes = (current, updater) => {
    if (!current?.pages) return current;
    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        data: updater(page.data),
      })),
    };
  };

  const createNote = useMutation({
    mutationFn: (note) => notesApi.create(note),
    onSuccess: () => refresh(workspaceQueryKeys.notes),
  });
  const updateNote = useMutation({
    mutationFn: ({ noteId, note }) => notesApi.update(noteId, note),
    onSuccess: (updated) => {
      queryClient.setQueryData(workspaceQueryKeys.note(updated.id), updated);
      const updateList = (notes) =>
        Array.isArray(notes)
          ? notes.map((note) =>
              note.id === updated.id
                ? { ...updated, preview: updated.preview ?? note.preview }
                : note,
            )
          : notes;

      queryClient.setQueryData(workspaceQueryKeys.notes, (current) =>
        updateInfiniteNotes(current, updateList),
      );
      queryClient.setQueryData(workspaceQueryKeys.favorites, updateList);
      queryClient.setQueryData(workspaceQueryKeys.archive, updateList);
      queryClient.setQueriesData(
        { queryKey: ['workspace', 'tag-notes'] },
        updateList,
      );
    },
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
