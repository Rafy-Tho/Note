import { useEffect } from 'react';
import {
  useNavigate,
  useLocation,
  useOutletContext,
  useSearchParams,
} from 'react-router-dom';
import { Alert } from '../components/common/Alert/Alert.jsx';
import { AuthForm } from '../features/auth/components/AuthForm.jsx';
import { useAuth } from '../features/auth/context/AuthContext.jsx';

export function AuthPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { authError } = useOutletContext() ?? {};
  const { error, verificationRequired, acceptSession } = useAuth();
  const token =
    searchParams.get('token') ?? searchParams.get('resetToken') ?? '';
  const verificationEmail = location.state?.verificationEmail ?? '';

  useEffect(() => {
    if (verificationRequired && mode !== 'verify')
      navigate('/verify-email', { replace: true });
  }, [mode, navigate, verificationRequired]);

  function handleAuthenticated(nextSession) {
    acceptSession(nextSession);
    if (nextSession.user.emailVerified)
      navigate('/workspace/notes', { replace: true });
    else navigate('/verify-email', { replace: true });
  }

  return (
    <>
      {(error || authError) && (
        <Alert>
          {error ||
            'The authentication request could not be completed. Try again.'}
        </Alert>
      )}
      <AuthForm
        initialMode={mode}
        initialToken={token}
        verificationRequired={verificationRequired}
        verificationEmail={verificationEmail}
        onAuthenticated={handleAuthenticated}
        onModeChange={(nextMode, options) =>
          navigate(
            `/${nextMode === 'login' ? 'login' : nextMode === 'register' ? 'register' : nextMode === 'verify' ? 'verify-email' : nextMode === 'forgot' ? 'forgot-password' : 'reset-password'}`,
            {
              state: options.verificationEmail
                ? { verificationEmail: options.verificationEmail }
                : null,
            },
          )
        }
      />
    </>
  );
}
