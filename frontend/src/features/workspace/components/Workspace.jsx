import { useState } from 'react';
import { Alert } from '../../../components/Alert/Alert.jsx';
import { Brand } from '../../../components/Brand/Brand.jsx';
import { authApi } from '../../auth/api/authApi.js';
import styles from './Workspace.module.css';

export function Workspace({ session, onSignOut }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      await authApi.logout();
      onSignOut();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.workspace} aria-labelledby="workspace-title">
      <div className={styles.topbar}>
        <Brand />
        <button
          className={styles.secondaryButton}
          onClick={signOut}
          disabled={busy}
        >
          {busy ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
      <div className={styles.content}>
        <p className={styles.eyebrow}>Authenticated workspace</p>
        <h1 id="workspace-title">Your notes, ready when you are.</h1>
        <p className={styles.email}>Signed in as {session.user.email}</p>
        {error && <Alert>{error}</Alert>}
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            +
          </span>
          <h2>Your workspace is clear.</h2>
          <p>Notes will appear here as the notes slice is connected.</p>
        </div>
      </div>
    </main>
  );
}
