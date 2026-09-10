import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { searchApi } from '../../search/services/searchApi.js';
import {
  useWorkspaceSearchQuery,
  workspaceQueryKeys,
} from './useWorkspaceQueries.js';

export function useWorkspaceSearch() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const query = searchParams.get('q') ?? '';
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const searchQuery = useWorkspaceSearchQuery(query, page);

  const updateQuery = useCallback(
    (nextQuery) => {
      const nextParams = new window.URLSearchParams(searchParams);
      if (nextQuery) nextParams.set('q', nextQuery);
      else nextParams.delete('q');
      nextParams.set('page', '1');
      setSearchParams(nextParams, { replace: true });
      setError(null);
    },
    [searchParams, setSearchParams],
  );

  const submitSearch = useCallback(
    async (event, nextPage = 1) => {
      event?.preventDefault();
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        setError('Enter search text.');
        return;
      }
      const nextParams = new window.URLSearchParams(searchParams);
      nextParams.set('page', String(nextPage));
      setSearchParams(nextParams, { replace: true });
      setError(null);
      try {
        await queryClient.fetchQuery({
          queryKey: workspaceQueryKeys.search(normalizedQuery, nextPage),
          queryFn: ({ signal }) =>
            searchApi.search(normalizedQuery, nextPage, { signal }),
        });
      } catch (requestError) {
        setError(requestError.message);
      }
    },
    [query, queryClient, searchParams, setSearchParams],
  );

  return {
    query,
    page,
    results: searchQuery.data?.data ?? [],
    total: searchQuery.data?.pagination?.total ?? 0,
    status: searchQuery.isFetching ? 'loading' : 'ready',
    error,
    updateQuery,
    submitSearch,
  };
}
