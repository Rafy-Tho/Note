import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import styles from '../../../app/App.module.css';

export function PublicRoute() {
  const { status, session } = useAuth();

  if (status === 'loading') {
    return (
      <main className={styles.loading} aria-live="polite">
        Checking your session...
      </main>
    );
  }

  if (session) return <Navigate to="/workspace/notes" replace />;

  return <Outlet />;
}
