import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { Dialog } from '../../../components/common/Dialog/Dialog.jsx';
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
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const identities = identitiesQuery.data ?? [];
  const busy = Boolean(
    pendingProvider ||
      signingOut ||
      linkProvider.isPending ||
      unlinkProvider.isPending,
  );

  async function unlink(provider) {
    setUnlinkTarget(provider);
  }

  async function confirmUnlink() {
    if (!unlinkTarget) return;
    setError(null);
    setPendingProvider(unlinkTarget);
    try {
      await unlinkProvider.mutateAsync(unlinkTarget);
      setUnlinkTarget(null);
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
    setSignOutConfirmOpen(true);
  }

  async function completeSignOut() {
    setError(null);
    setSigningOut(true);
    try {
      await logout();
    } catch (requestError) {
      setError(requestError.message);
      setSigningOut(false);
    }
  }

  function confirmSignOut() {
    setSignOutConfirmOpen(false);
    canLeaveDraft(() => void completeSignOut());
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
      {unlinkTarget && (
        <Dialog
          title={`Unlink ${unlinkTarget}?`}
          description="You will no longer be able to use this provider to sign in unless you link it again."
          onClose={() => setUnlinkTarget(null)}
          actions={
            <>
              <button className={styles.secondaryButton} type="button" onClick={() => setUnlinkTarget(null)}>
                Cancel
              </button>
              <button className={styles.dangerButton} type="button" onClick={() => void confirmUnlink()}>
                Unlink
              </button>
            </>
          }
        />
      )}
      {signOutConfirmOpen && (
        <Dialog
          title="Sign out?"
          description="Your workspace will be closed. Any unsaved changes must be handled before signing out."
          onClose={() => setSignOutConfirmOpen(false)}
          actions={
            <>
              <button className={styles.secondaryButton} type="button" onClick={() => setSignOutConfirmOpen(false)}>
                Cancel
              </button>
              <button className={styles.dangerButton} type="button" onClick={confirmSignOut}>
                Sign out
              </button>
            </>
          }
        />
      )}
    </>
  );
}
