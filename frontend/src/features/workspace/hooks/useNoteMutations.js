import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../../notes/services/notesApi.js';
import { workspaceQueryKeys } from './useWorkspaceQueries.js';

function refresh(queryClient, ...keys) {
  return Promise.all(
    keys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
  );
}

function updateInfiniteNotes(current, updater) {
  if (!current?.pages) return current;
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      data: updater(page.data),
    })),
  };
}

export function useNoteMutations() {
  const queryClient = useQueryClient();

  const createNote = useMutation({
    mutationFn: (note) => notesApi.create(note),
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.notes,
        workspaceQueryKeys.sidebarCounts,
      ),
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
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.notes,
        workspaceQueryKeys.trash,
        workspaceQueryKeys.sidebarCounts,
      ),
  });

  const restoreNote = useMutation({
    mutationFn: (noteId) => notesApi.restore(noteId),
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.notes,
        workspaceQueryKeys.trash,
        workspaceQueryKeys.sidebarCounts,
      ),
  });

  const permanentlyDelete = useMutation({
    mutationFn: (noteId) => notesApi.permanentlyDelete(noteId),
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.trash,
        workspaceQueryKeys.sidebarCounts,
      ),
  });

  const favoriteNote = useMutation({
    mutationFn: ({ noteId, favorite }) =>
      favorite ? notesApi.favorite(noteId) : notesApi.unfavorite(noteId),
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.notes,
        workspaceQueryKeys.favorites,
        workspaceQueryKeys.sidebarCounts,
      ),
  });

  const archiveNote = useMutation({
    mutationFn: ({ noteId, archived }) =>
      archived ? notesApi.unarchive(noteId) : notesApi.archive(noteId),
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.notes,
        workspaceQueryKeys.archive,
        workspaceQueryKeys.sidebarCounts,
      ),
  });

  const assignNotebook = useMutation({
    mutationFn: ({ noteId, notebookId }) =>
      notesApi.assignNotebook(noteId, notebookId),
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.notes,
        workspaceQueryKeys.sidebarCounts,
      ),
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
  };
}
