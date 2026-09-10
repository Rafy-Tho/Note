import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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

export function useWorkspaceQueries({
  view,
  selectedTagId,
  searchQuery,
  searchPage,
  noteId,
}) {
  const queryClient = useQueryClient();
  const notes = useInfiniteQuery({
    queryKey: workspaceQueryKeys.notes,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      notesApi.list(
        { page: pageParam, limit: NOTES_PAGE_SIZE },
        { signal },
      ),
    getNextPageParam: getNextNotesPageParam,
  });
  const notebooks = useQuery({
    queryKey: workspaceQueryKeys.notebooks,
    queryFn: ({ signal }) => notebooksApi.list({ signal }),
  });
  const tags = useQuery({
    queryKey: workspaceQueryKeys.tags,
    queryFn: ({ signal }) => tagsApi.list({ signal }),
  });
  const trash = useQuery({
    queryKey: workspaceQueryKeys.trash,
    queryFn: ({ signal }) => notesApi.listTrash({ signal }),
    enabled: view === 'trash',
  });
  const favorites = useQuery({
    queryKey: workspaceQueryKeys.favorites,
    queryFn: ({ signal }) => notesApi.listFavorites({ signal }),
    enabled: view === 'favorites',
  });
  const archive = useQuery({
    queryKey: workspaceQueryKeys.archive,
    queryFn: async ({ signal }) => {
      const result = await notesApi.list(
        { state: 'archived' },
        { signal },
      );
      return result.data;
    },
    enabled: view === 'archive',
  });
  const tagNotes = useQuery({
    queryKey: workspaceQueryKeys.tagNotes(selectedTagId),
    queryFn: ({ signal }) => tagsApi.listNotes(selectedTagId, { signal }),
    enabled: view === 'tags' && Boolean(selectedTagId),
  });
  const identities = useQuery({
    queryKey: workspaceQueryKeys.identities,
    queryFn: async ({ signal }) => {
      const result = await authApi.listLinkedProviders({ signal });
      return Array.isArray(result) ? result : result.identities ?? [];
    },
  });
  const note = useQuery({
    queryKey: workspaceQueryKeys.note(noteId),
    queryFn: ({ signal }) => notesApi.get(noteId, { signal }),
    enabled: Boolean(noteId),
    staleTime: 60_000,
  });
  const search = useQuery({
    queryKey: workspaceQueryKeys.search(searchQuery.trim(), searchPage),
    queryFn: ({ signal }) =>
      searchApi.search(searchQuery.trim(), searchPage, { signal }),
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
    note,
    search,
    isInitialLoading: [notes, notebooks, tags].some((query) => query.isLoading),
    initialError:
      [notes, notebooks, tags].find((query) => query.isLoadingError)?.error ??
      null,
    refetchInitial: () => Promise.all([notes.refetch(), notebooks.refetch(), tags.refetch()]),
    searchNotes: (query, page) =>
      queryClient.fetchQuery({
        queryKey: workspaceQueryKeys.search(query.trim(), page),
        queryFn: ({ signal }) =>
          searchApi.search(query.trim(), page, { signal }),
      }),
  };
}
