import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { Dialog } from '../../../components/common/Dialog/Dialog.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { useAccountMutations } from '../hooks/useAccountMutations.js';
import { useWorkspaceIdentitiesQuery } from '../hooks/useWorkspaceQueries.js';

const providers = ['google', 'facebook'];

function providerLabel(provider) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function callbackMessage(code) {
  if (code === 'PROVIDER_LINK_REQUIRED')
    return 'This provider belongs to another account. Sign in to that account before linking it.';
  if (code === 'PROVIDER_EMAIL_NOT_VERIFIED')
    return 'The provider did not return a verified email address.';
  if (code === 'PROVIDER_IDENTITY_CONFLICT')
    return 'This provider account is already linked to another account.';
  if (code === 'EMAIL_VERIFICATION_REQUIRED')
    return 'Verify your account email before linking a provider.';
  return 'The provider could not be linked. Try again.';
}

export function WorkspaceAccountControls({ styles, canLeaveDraft }) {
  const { logout } = useAuth();
  const identitiesQuery = useWorkspaceIdentitiesQuery();
  const { linkProvider, unlinkProvider } = useAccountMutations();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingProvider, setPendingProvider] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const identities = identitiesQuery.data ?? [];
  const busy = Boolean(
    pendingProvider ||
    signingOut ||
    linkProvider.isPending ||
    unlinkProvider.isPending,
  );

  useEffect(() => {
    const linkedProvider = searchParams.get('authLinked');
    const authError = searchParams.get('authError');
    if (!linkedProvider && !authError) return;

    if (linkedProvider && providers.includes(linkedProvider)) {
      setSuccess(`${providerLabel(linkedProvider)} is now linked.`);
      setError(null);
    } else if (authError) {
      setError(callbackMessage(authError));
      setSuccess(null);
    }

    searchParams.delete('authLinked');
    searchParams.delete('authError');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  async function unlink(provider) {
    setSuccess(null);
    setUnlinkTarget(provider);
  }

  async function confirmUnlink() {
    if (!unlinkTarget) return;
    setError(null);
    setSuccess(null);
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
    setSuccess(null);
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
        {identitiesQuery.error && (
          <Alert>{identitiesQuery.error.message}</Alert>
        )}
        {error && <Alert>{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}
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
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setUnlinkTarget(null)}
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                onClick={() => void confirmUnlink()}
              >
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
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setSignOutConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                onClick={confirmSignOut}
              >
                Sign out
              </button>
            </>
          }
        />
      )}
    </>
  );
}
