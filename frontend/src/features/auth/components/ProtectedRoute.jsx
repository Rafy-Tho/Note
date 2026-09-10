import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import styles from '../../../app/App.module.css';

export function ProtectedRoute() {
  const { status, session } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <main className={styles.loading} aria-live="polite">
        Checking your session...
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
