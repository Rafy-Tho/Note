import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../auth/services/authApi.js';
import { workspaceQueryKeys } from './useWorkspaceQueries.js';

export function useAccountMutations() {
  const queryClient = useQueryClient();
  const linkProvider = useMutation({
    mutationFn: (provider) => authApi.startProviderLink(provider),
  });
  const unlinkProvider = useMutation({
    mutationFn: (provider) => authApi.unlinkProvider(provider),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.identities }),
  });

  return { linkProvider, unlinkProvider };
}
