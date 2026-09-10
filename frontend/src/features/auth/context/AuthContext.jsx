import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [session, setSessionState] = useState(null);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();
  const userIdRef = useRef(null);

  function applySession(nextSession) {
    const nextUserId = nextSession?.user?.id ?? null;
    if (userIdRef.current && nextUserId !== userIdRef.current)
      queryClient.clear();
    if (!nextUserId) queryClient.clear();
    userIdRef.current = nextUserId;
    setSessionState(nextSession);
  }

  async function refreshSession() {
    setError(null);
    try {
      const nextSession = await authApi.getSession();
      applySession(
        nextSession.authenticated && nextSession.user.emailVerified
          ? nextSession
          : null,
      );
      setStatus('ready');
      return nextSession;
    } catch (requestError) {
      setError(requestError.message);
      applySession(null);
      setStatus('ready');
      throw requestError;
    }
  }

  useEffect(() => {
    void refreshSession().catch(() => undefined);
  }, []);

  async function login(credentials) {
    const nextSession = await authApi.login(credentials);
    applySession(nextSession.user.emailVerified ? nextSession : null);
    setError(null);
    return nextSession;
  }

  function acceptSession(nextSession) {
    applySession(
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
      applySession(null);
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
