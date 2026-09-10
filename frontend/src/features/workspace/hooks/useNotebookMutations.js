import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notebooksApi } from '../../notebooks/services/notebooksApi.js';
import { workspaceQueryKeys } from './useWorkspaceQueries.js';

function refresh(queryClient, ...keys) {
  return Promise.all(
    keys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
  );
}

export function useNotebookMutations() {
  const queryClient = useQueryClient();

  const createNotebook = useMutation({
    mutationFn: (name) => notebooksApi.create(name),
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.notebooks,
        workspaceQueryKeys.sidebarCounts,
      ),
  });

  const renameNotebook = useMutation({
    mutationFn: ({ notebookId, name }) => notebooksApi.rename(notebookId, name),
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.notebooks,
        workspaceQueryKeys.sidebarCounts,
      ),
  });

  const deleteNotebook = useMutation({
    mutationFn: (notebookId) => notebooksApi.remove(notebookId),
    onSuccess: () =>
      refresh(
        queryClient,
        workspaceQueryKeys.notebooks,
        workspaceQueryKeys.notes,
        workspaceQueryKeys.sidebarCounts,
      ),
  });

  return { createNotebook, renameNotebook, deleteNotebook };
}
