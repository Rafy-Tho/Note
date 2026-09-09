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

  useEffect(() => {
    authApi
      .getSession()
      .then((nextSession) => {
        setSession(nextSession.authenticated ? nextSession : null);
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
      <aside className={styles.aside}>
        <div>
          <Brand />
          <div className={styles.badge}>
            <span /> v2.4.0 / private
          </div>
        </div>
        <div className={styles.message}>
          <p className={styles.eyebrow}>A quieter place to think</p>
          <h2>Capture the thought before it gets away.</h2>
          <p>Your personal notes, organized around focus instead of noise.</p>
        </div>
        <div className={styles.footer}>
          <span /> Zero telemetry <span /> No trackers
        </div>
      </aside>
      <div className={styles.main}>
        {error && <Alert>{error}</Alert>}
        <AuthForm onAuthenticated={setSession} />
      </div>
    </main>
  );
}
