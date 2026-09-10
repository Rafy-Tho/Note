import { useEffect, useState } from 'react';
import { Alert } from '../components/Alert/Alert.jsx';
import { Brand } from '../components/Brand/Brand.jsx';
import { authApi } from '../features/auth/api/authApi.js';
import { AuthForm } from '../features/auth/components/AuthForm.jsx';
import { Workspace } from '../features/workspace/components/Workspace.jsx';
import styles from './App.module.css';

export function App() {
  const [status, setStatus] = useState('loading');
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const authParams = new window.URLSearchParams(window.location.search);
  const authError = authParams.get('authError');
  const token = authParams.get('token');
  const resetToken =
    authParams.get('resetToken') ||
    (window.location.pathname === '/reset-password' ? token : '');

  useEffect(() => {
    authApi
      .getSession()
      .then((nextSession) => {
        setSession(
          nextSession.authenticated && nextSession.user.emailVerified
            ? nextSession
            : null,
        );
        setVerificationRequired(
          Boolean(nextSession.authenticated && !nextSession.user.emailVerified),
        );
        setStatus('ready');
      })
      .catch((requestError) => {
        setError(requestError.message);
        setStatus('ready');
      });
  }, []);

  if (status === 'loading')
    return (
      <main className={styles.loading} aria-live="polite">
        Checking your session...
      </main>
    );
  if (session)
    return <Workspace session={session} onSignOut={() => setSession(null)} />;

  return (
    <main className={styles.authShell}>
      <aside className={styles.authPanel}>
        <div className={styles.authPanelTop}>
          <Brand />
          <div className={styles.badge}>
            <span /> v2.4.0 / private
          </div>
        </div>
        <div className={styles.authContent}>
          {(error || authError) && (
            <Alert>
              {error ||
                'The authentication request could not be completed. Try again.'}
            </Alert>
          )}
          <AuthForm
            onAuthenticated={(nextSession) => {
              if (nextSession.user.emailVerified) {
                setSession(nextSession);
                setVerificationRequired(false);
              } else {
                setVerificationRequired(true);
              }
            }}
            verificationRequired={verificationRequired}
            initialMode={resetToken ? 'reset' : 'login'}
            initialToken={resetToken || ''}
          />
        </div>
        <div className={styles.footer}>
          <span /> Strict private storage protocol
          <span /> No telemetry · No trackers
        </div>
      </aside>
      <div className={styles.preview}>
        <div className={styles.previewGrid} aria-hidden="true" />
        <div className={styles.previewTopline}>
          <span>
            <b>SYS_SPEC</b> 1440px / 3-PANEL WORKSPACE
          </span>
        </div>
        <div className={styles.previewStage}>
          <div className={styles.previewWindow}>
            <div className={styles.windowBar}>
              <div className={styles.windowTitle}>
                <span className={styles.windowDots}>
                  <i />
                  <i />
                  <i />
                </span>
                workspace_root / distributed_sync.md
              </div>
              <span className={styles.windowStatus}>
                <i /> Saved (Local WAL)
              </span>
            </div>
            <div className={styles.windowBody}>
              <div className={styles.miniSidebar}>
                <strong>+ New Note</strong>
                <span className={styles.miniActive}>
                  ≡ Notes <em>34</em>
                </span>
                <span>
                  ☆ Favorites <em>5</em>
                </span>
                <span>
                  ↧ Archive <em>12</em>
                </span>
                <span>
                  ⌫ Trash <em>3</em>
                </span>
                <small>NOTEBOOKS</small>
                <span>▸ Architecture</span>
                <span>▸ Journal</span>
              </div>
              <div className={styles.miniEditor}>
                <div className={styles.miniTags}>
                  <span>#distributed-db</span>
                  <span>#security</span>
                  <small>Oct 14, 2024 · 1,420 words</small>
                </div>
                <h2>Distributed State Sync &amp; Conflict Resolution</h2>
                <p>
                  When syncing notes across partitioned edge clients,
                  deterministic state convergence is non-negotiable.
                </p>
                <code>
                  <b>type</b> DocumentState = &#123; id: string; version:
                  number; &#125;
                </code>
                <div className={styles.miniFooter}>
                  <span>LN 42, COL 88 · UTF-8 Markdown</span>
                  <b>E2EE Verified · AES-256</b>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.callouts}>
            <div>
              <b>01 // Zero Knowledge</b>
              <span>
                Private notes are encrypted locally before persistent commit.
              </span>
            </div>
            <div>
              <b>02 // Writing-First</b>
              <span>
                Dominant distraction-free editor with instant autosave.
              </span>
            </div>
            <div>
              <b>03 // Fast Tri-Pane</b>
              <span>Organization across notebooks, tags, and search.</span>
            </div>
          </div>
        </div>
        <div className={styles.previewFooter}>
          <span>Strict Private Storage Protocol</span>
          <span>No telemetry · No trackers · Single tenant</span>
        </div>
      </div>
    </main>
  );
}
