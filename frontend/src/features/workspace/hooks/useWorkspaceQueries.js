import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../auth/services/authApi.js';
import { notesApi } from '../../notes/services/notesApi.js';
import { searchApi } from '../../search/services/searchApi.js';
import { tagsApi } from '../../tags/services/tagsApi.js';
import { notebooksApi } from '../../notebooks/services/notebooksApi.js';

export const workspaceQueryKeys = {
  notes: ['workspace', 'notes'],
  trash: ['workspace', 'trash'],
  favorites: ['workspace', 'favorites'],
  archive: ['workspace', 'archive'],
  tags: ['workspace', 'tags'],
  tagNotes: (tagId) => ['workspace', 'tag-notes', tagId],
  notebooks: ['workspace', 'notebooks'],
  identities: ['workspace', 'identities'],
  note: (noteId) => ['workspace', 'note', noteId],
  search: (query, page) => ['workspace', 'search', query, page],
};

export function useWorkspaceQueries({ view, selectedTagId, searchQuery, searchPage }) {
  const queryClient = useQueryClient();
  const notes = useQuery({
    queryKey: workspaceQueryKeys.notes,
    queryFn: () => notesApi.list(),
  });
  const notebooks = useQuery({
    queryKey: workspaceQueryKeys.notebooks,
    queryFn: () => notebooksApi.list(),
  });
  const tags = useQuery({
    queryKey: workspaceQueryKeys.tags,
    queryFn: () => tagsApi.list(),
  });
  const trash = useQuery({
    queryKey: workspaceQueryKeys.trash,
    queryFn: () => notesApi.listTrash(),
    enabled: view === 'trash',
  });
  const favorites = useQuery({
    queryKey: workspaceQueryKeys.favorites,
    queryFn: () => notesApi.listFavorites(),
    enabled: view === 'favorites',
  });
  const archive = useQuery({
    queryKey: workspaceQueryKeys.archive,
    queryFn: () => notesApi.list({ state: 'archived' }),
    enabled: view === 'archive',
  });
  const tagNotes = useQuery({
    queryKey: workspaceQueryKeys.tagNotes(selectedTagId),
    queryFn: () => tagsApi.listNotes(selectedTagId),
    enabled: view === 'tags' && Boolean(selectedTagId),
  });
  const identities = useQuery({
    queryKey: workspaceQueryKeys.identities,
    queryFn: async () => {
      const result = await authApi.listLinkedProviders();
      return Array.isArray(result) ? result : result.identities ?? [];
    },
  });
  const search = useQuery({
    queryKey: workspaceQueryKeys.search(searchQuery.trim(), searchPage),
    queryFn: () => searchApi.search(searchQuery.trim(), searchPage),
    enabled: false,
  });

  return {
    notes,
    notebooks,
    tags,
    trash,
    favorites,
    archive,
    tagNotes,
    identities,
    search,
    isInitialLoading: [notes, notebooks, tags].some((query) => query.isLoading),
    initialError: [notes, notebooks, tags].find((query) => query.error)?.error ?? null,
    refetchInitial: () => Promise.all([notes.refetch(), notebooks.refetch(), tags.refetch()]),
    searchNotes: (query, page) =>
      queryClient.fetchQuery({
        queryKey: workspaceQueryKeys.search(query.trim(), page),
        queryFn: () => searchApi.search(query.trim(), page),
      }),
  };
}
