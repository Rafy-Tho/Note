import { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { authApi } from '../services/authApi.js';
import { validateCredentials } from '../validation/authValidation.js';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './AuthForm.module.css';

export function AuthForm({
  onAuthenticated,
  initialMode = 'login',
  initialToken = '',
  verificationRequired = false,
  verificationEmail = '',
  onModeChange,
}) {
  const { login } = useAuth();
  const [mode, setMode] = useState(
    initialToken ? initialMode : verificationRequired ? 'verify' : initialMode,
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(initialToken);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const isRegister = mode === 'register';
  const isVerify = mode === 'verify';
  const isReset = mode === 'reset';
  const isForgot = mode === 'forgot';

  function switchMode(nextMode, options = {}) {
    setMode(nextMode);
    onModeChange?.(nextMode, options);
    setError(null);
    setFieldErrors({});
    setSuccess(null);
    setCanResendVerification(false);
  }

  function providerError(requestError) {
    if (requestError.code === 'PROVIDER_LINK_REQUIRED') {
      return 'An account already exists with this email. Sign in first, then link this provider from your workspace.';
    }
    if (requestError.code === 'PROVIDER_UNAVAILABLE') {
      return 'This sign-in provider is temporarily unavailable. Try again later.';
    }
    if (requestError.code === 'PROVIDER_EMAIL_NOT_VERIFIED') {
      return 'This provider did not return a verified email address.';
    }
    return requestError.message;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (isVerify) {
      setBusy(true);
      try {
        const nextSession = await authApi.verifyEmail(token.trim());
        onAuthenticated(nextSession);
        setToken('');
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (isForgot) {
      if (!email.trim()) {
        setFieldErrors({ email: 'Enter your account email.' });
        return;
      }
      setBusy(true);
      try {
        await authApi.requestPasswordReset(email.trim());
        setSuccess(
          'If that account can reset a password, a reset link is on its way.',
        );
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (isReset) {
      const validation = validateCredentials({
        email: 'reset@example.com',
        password,
      });
      setFieldErrors({ password: validation.fields.password });
      if (validation.fields.password) return;
      setBusy(true);
      try {
        await authApi.confirmPasswordReset(token.trim(), password);
        setSuccess('Password reset. Sign in with your new password.');
        setPassword('');
        setToken('');
        switchMode('login');
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    const validation = validateCredentials({ email, password });
    setFieldErrors(validation.fields);
    if (Object.keys(validation.fields).length > 0) return;

    setBusy(true);
    try {
      if (isRegister) {
        await authApi.register(validation.credentials);
        setEmail(validation.credentials.email);
        setPassword('');
        setCanResendVerification(false);
        switchMode('verify', {
          verificationEmail: validation.credentials.email,
        });
        setSuccess(
          'Account created. Check your email, then verify your address to open your workspace.',
        );
      } else {
        const nextSession = await login(validation.credentials);
        if (!nextSession.user.emailVerified) {
          setEmail(validation.credentials.email);
          switchMode('verify', {
            verificationEmail: validation.credentials.email,
          });
          setSuccess('Verify your email before opening private notes.');
        } else {
          onAuthenticated(nextSession);
        }
      }
    } catch (requestError) {
      setError(providerError(requestError));
      setFieldErrors(requestError.fields ?? {});
      setCanResendVerification(
        isRegister &&
          ['DUPLICATE_EMAIL', 'MAIL_UNAVAILABLE'].includes(requestError.code),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="auth-title">
      {!isForgot && !isReset && !isVerify && (
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Authentication mode"
        >
          <button
            className={mode === 'login' ? styles.tabActive : styles.tab}
            onClick={() => switchMode('login')}
            role="tab"
            aria-selected={mode === 'login'}
            type="button"
          >
            Sign In
          </button>
          <button
            className={isRegister ? styles.tabActive : styles.tab}
            onClick={() => switchMode('register')}
            role="tab"
            aria-selected={isRegister}
            type="button"
          >
            Create Account
          </button>
        </div>
      )}
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Private workspace</p>
        <h1 id="auth-title">
          {isVerify
            ? 'Verify your email'
            : isForgot
              ? 'Reset your password'
              : isReset
                ? 'Choose a new password'
                : isRegister
                  ? 'Create your vault'
                  : 'Sign in to your vault'}
        </h1>
        <p>
          {isVerify
            ? 'Email verification is required before private notes are available.'
            : isForgot
              ? 'We will send a generic recovery response for every address.'
              : isReset
                ? 'Use a valid reset link to replace your password.'
                : 'Private personal note workspace with access-controlled server storage.'}
        </p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {success && <Alert tone="success">{success}</Alert>}
        {error && <Alert>{error}</Alert>}
        {!isVerify && !isReset && (
          <div className={styles.field}>
            <label htmlFor="email">Account Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              disabled={busy}
            />
            {fieldErrors.email && (
              <small id="email-error">{fieldErrors.email}</small>
            )}
          </div>
        )}
        {(!isForgot || isReset) && !isVerify && (
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="password">Master Key / Password</label>
              <button
                className={styles.textButton}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="icon" size={14} aria-hidden="true" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="icon" size={14} aria-hidden="true" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder="12 characters minimum"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? 'password-error' : undefined
              }
              disabled={busy}
            />
            {fieldErrors.password && (
              <small id="password-error">{fieldErrors.password}</small>
            )}
          </div>
        )}
        {isVerify && (
          <div className={styles.field}>
            <label htmlFor="verification-code">Verification Code</label>
            <input
              id="verification-code"
              name="verification-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              disabled={busy}
            />
          </div>
        )}
        {isReset && (
          <div className={styles.field}>
            <label htmlFor="reset-token">Reset Token</label>
            <input
              id="reset-token"
              name="reset-token"
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              disabled={busy}
            />
          </div>
        )}
        {isRegister && (
          <div className={styles.requirements}>
            <strong>Password requirements</strong>
            <span>At least 12 characters</span>
            <span>Password is hashed before storage</span>
          </div>
        )}
        {isRegister && (
          <p className={styles.legalCopy}>
            Review the <Link to="/privacy-policy">Privacy Policy</Link> before
            creating your account.
          </p>
        )}
        <button className={styles.primaryButton} type="submit" disabled={busy}>
          {busy
            ? 'Working...'
            : isVerify
              ? 'Verify Email'
              : isForgot
                ? 'Send Reset Link'
                : isReset
                  ? 'Reset Password'
                  : isRegister
                    ? 'Create Account'
                    : 'Unlock Workspace'}
          {!busy && (
            <ArrowRight className="icon" size={16} aria-hidden="true" />
          )}
        </button>
        {(isVerify || (isRegister && canResendVerification)) && (
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await authApi.resendVerification(verificationEmail || email);
                switchMode('verify', { verificationEmail: email });
                setSuccess(
                  'If the account is eligible, a new verification code is on its way.',
                );
              } catch (requestError) {
                setError(requestError.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Resend verification email
          </button>
        )}
        {!isVerify && !isReset && (
          <p className={styles.switchCopy}>
            {isForgot
              ? 'Remembered your password?'
              : isRegister
                ? 'Already have a vault?'
                : "Don't have a vault yet?"}{' '}
            <button
              className={styles.textButton}
              type="button"
              onClick={() =>
                switchMode(
                  isForgot ? 'login' : isRegister ? 'login' : 'register',
                )
              }
            >
              {isForgot
                ? 'Sign in here'
                : isRegister
                  ? 'Sign in here'
                  : 'Create a new one'}
            </button>
          </p>
        )}
        {mode === 'login' && (
          <>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => switchMode('forgot')}
            >
              Forgot password?
            </button>
            <div className={styles.providerActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => authApi.startProviderSignIn('google')}
              >
                Continue with Google
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => authApi.startProviderSignIn('facebook')}
              >
                Continue with Facebook
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
