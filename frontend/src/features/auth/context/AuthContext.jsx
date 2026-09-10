import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [session, setSessionState] = useState(null);
  const [error, setError] = useState(null);

  async function refreshSession() {
    setError(null);
    try {
      const nextSession = await authApi.getSession();
      setSessionState(
        nextSession.authenticated && nextSession.user.emailVerified
          ? nextSession
          : null,
      );
      setStatus('ready');
      return nextSession;
    } catch (requestError) {
      setError(requestError.message);
      setSessionState(null);
      setStatus('ready');
      throw requestError;
    }
  }

  useEffect(() => {
    void refreshSession().catch(() => undefined);
  }, []);

  async function login(credentials) {
    const nextSession = await authApi.login(credentials);
    setSessionState(nextSession.user.emailVerified ? nextSession : null);
    setError(null);
    return nextSession;
  }

  function acceptSession(nextSession) {
    setSessionState(
      nextSession?.authenticated === false ||
        nextSession?.user?.emailVerified === false
        ? null
        : nextSession,
    );
    setError(null);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setSessionState(null);
    }
  }

  const value = useMemo(
    () => ({
      status,
      session,
      error,
      verificationRequired: Boolean(
        session?.authenticated && !session.user.emailVerified,
      ),
      login,
      logout,
      refreshSession,
      acceptSession,
    }),
    [error, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
