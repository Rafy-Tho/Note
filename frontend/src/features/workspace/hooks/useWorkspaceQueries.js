import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { authApi } from '../../auth/services/authApi.js';
import { notesApi } from '../../notes/services/notesApi.js';
import { searchApi } from '../../search/services/searchApi.js';
import { tagsApi } from '../../tags/services/tagsApi.js';
import { notebooksApi } from '../../notebooks/services/notebooksApi.js';
import { workspaceApi } from '../services/workspaceApi.js';

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
  sidebarCounts: ['workspace', 'sidebar-counts'],
};

const NOTES_PAGE_SIZE = 20;
const EMPTY_NOTES = [];

export function getNextNotesPageParam(lastPage, allPages) {
  const loaded = allPages.reduce(
    (count, page) => count + (page.data?.length ?? 0),
    0,
  );
  return loaded < (lastPage.pagination?.total ?? 0)
    ? lastPage.pagination.page + 1
    : undefined;
}

export function flattenNotesPages(data) {
  return data?.pages.flatMap((page) => page.data ?? []) ?? EMPTY_NOTES;
}

export function useWorkspaceNotesQuery(notebookId = '') {
  return useInfiniteQuery({
    queryKey: [...workspaceQueryKeys.notes, notebookId],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      notesApi.list(
        {
          page: pageParam,
          limit: NOTES_PAGE_SIZE,
          notebookId: notebookId || undefined,
        },
        { signal },
      ),
    getNextPageParam: getNextNotesPageParam,
  });
}

export function useWorkspaceTrashQuery(enabled = false) {
  return useQuery({
    queryKey: workspaceQueryKeys.trash,
    queryFn: ({ signal }) => notesApi.listTrash({ signal }),
    enabled,
  });
}

export function useWorkspaceFavoritesQuery(enabled = false) {
  return useQuery({
    queryKey: workspaceQueryKeys.favorites,
    queryFn: ({ signal }) => notesApi.listFavorites({ signal }),
    enabled,
  });
}

export function useWorkspaceArchiveQuery(enabled = false) {
  return useQuery({
    queryKey: workspaceQueryKeys.archive,
    queryFn: async ({ signal }) => {
      const result = await notesApi.list({ state: 'archived' }, { signal });
      return result.data;
    },
    enabled,
  });
}

export function useWorkspaceTagNotesQuery(tagId, enabled = false) {
  return useQuery({
    queryKey: workspaceQueryKeys.tagNotes(tagId),
    queryFn: ({ signal }) => tagsApi.listNotes(tagId, { signal }),
    enabled: enabled && Boolean(tagId),
  });
}

export function useWorkspaceTagsQuery() {
  return useQuery({
    queryKey: workspaceQueryKeys.tags,
    queryFn: ({ signal }) => tagsApi.list({ signal }),
  });
}

export function useWorkspaceNotebooksQuery() {
  return useQuery({
    queryKey: workspaceQueryKeys.notebooks,
    queryFn: ({ signal }) => notebooksApi.list({ signal }),
  });
}

export function useWorkspaceSidebarCountsQuery() {
  return useQuery({
    queryKey: workspaceQueryKeys.sidebarCounts,
    queryFn: ({ signal }) => workspaceApi.getSidebarCounts({ signal }),
  });
}

export function useWorkspaceNoteQuery(noteId) {
  return useQuery({
    queryKey: workspaceQueryKeys.note(noteId),
    queryFn: ({ signal }) => notesApi.get(noteId, { signal }),
    enabled: Boolean(noteId),
    staleTime: 60_000,
  });
}

export function useWorkspaceIdentitiesQuery() {
  return useQuery({
    queryKey: workspaceQueryKeys.identities,
    queryFn: async ({ signal }) => {
      const result = await authApi.listLinkedProviders({ signal });
      return Array.isArray(result) ? result : (result.identities ?? []);
    },
  });
}

export function useWorkspaceSearchQuery(query, page) {
  const normalizedQuery = query.trim();
  return useQuery({
    queryKey: workspaceQueryKeys.search(normalizedQuery, page),
    queryFn: ({ signal }) =>
      searchApi.search(normalizedQuery, page, { signal }),
    enabled: false,
  });
}
