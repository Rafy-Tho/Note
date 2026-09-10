import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { useAccountMutations } from '../hooks/useAccountMutations.js';
import { useWorkspaceIdentitiesQuery } from '../hooks/useWorkspaceQueries.js';

const providers = ['google', 'facebook'];

export function WorkspaceAccountControls({ styles, canLeaveDraft }) {
  const { logout } = useAuth();
  const identitiesQuery = useWorkspaceIdentitiesQuery();
  const { linkProvider, unlinkProvider } = useAccountMutations();
  const [pendingProvider, setPendingProvider] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(null);
  const identities = identitiesQuery.data ?? [];
  const busy = Boolean(
    pendingProvider ||
      signingOut ||
      linkProvider.isPending ||
      unlinkProvider.isPending,
  );

  async function unlink(provider) {
    if (!window.confirm(`Unlink ${provider} from this account?`)) return;
    setError(null);
    setPendingProvider(provider);
    try {
      await unlinkProvider.mutateAsync(provider);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingProvider(null);
    }
  }

  async function link(provider) {
    setError(null);
    setPendingProvider(provider);
    try {
      await linkProvider.mutateAsync(provider);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingProvider(null);
    }
  }

  async function signOut() {
    if (!canLeaveDraft()) return;
    setError(null);
    setSigningOut(true);
    try {
      await logout();
    } catch (requestError) {
      setError(requestError.message);
      setSigningOut(false);
    }
  }

  return (
    <>
      <div className={styles.accountControls}>
        <span className={styles.eyebrow}>Sign-in methods</span>
        {identitiesQuery.isLoading ? (
          <span className={styles.accountHint}>Loading...</span>
        ) : (
          providers.map((provider) => {
            const linked = identities.some(
              (identity) => identity.provider === provider,
            );
            return linked ? (
              <div className={styles.identityRow} key={provider}>
                <span>{provider}</span>
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={() => void unlink(provider)}
                  disabled={busy}
                >
                  Unlink
                </button>
              </div>
            ) : (
              <button
                className={styles.identityButton}
                type="button"
                key={provider}
                onClick={() => void link(provider)}
                disabled={busy}
              >
                Link {provider}
              </button>
            );
          })
        )}
        {identitiesQuery.error && <Alert>{identitiesQuery.error.message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>
      <button
        className={styles.signOutButton}
        type="button"
        onClick={() => void signOut()}
        disabled={busy}
      >
        <LogOut className="icon" size={16} aria-hidden="true" />
        <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
      </button>
    </>
  );
}
