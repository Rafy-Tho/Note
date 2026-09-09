import { useState } from 'react';
import { Alert } from '../../../components/Alert/Alert.jsx';
import { authApi } from '../api/authApi.js';
import { validateCredentials } from '../authValidation.js';
import styles from './AuthForm.module.css';

export function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const isRegister = mode === 'register';

  function switchMode(nextMode) {
    setMode(nextMode);
    setError(null);
    setFieldErrors({});
    setSuccess(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const validation = validateCredentials({ email, password });
    setFieldErrors(validation.fields);
    if (Object.keys(validation.fields).length > 0) return;

    setBusy(true);
    try {
      if (isRegister) {
        await authApi.register(validation.credentials);
        setMode('login');
        setPassword('');
        setSuccess('Account created. Sign in to unlock your workspace.');
      } else {
        onAuthenticated(await authApi.login(validation.credentials));
      }
    } catch (requestError) {
      setError(requestError.message);
      setFieldErrors(requestError.fields ?? {});
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="auth-title">
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
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Private workspace</p>
        <h1 id="auth-title">
          {isRegister ? 'Create your vault' : 'Sign in to your vault'}
        </h1>
        <p>Private, focused notes for the things worth remembering.</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {success && <Alert tone="success">{success}</Alert>}
        {error && <Alert>{error}</Alert>}
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
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor="password">Master Key / Password</label>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
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
        {isRegister && (
          <div className={styles.requirements}>
            <strong>Password requirements</strong>
            <span>At least 12 characters</span>
            <span>Password is hashed before storage</span>
          </div>
        )}
        <button className={styles.primaryButton} type="submit" disabled={busy}>
          {busy
            ? 'Working...'
            : isRegister
              ? 'Create Account'
              : 'Unlock Workspace'}
          {!busy && <span aria-hidden="true">→</span>}
        </button>
        <p className={styles.switchCopy}>
          {isRegister ? 'Already have a vault?' : "Don't have a vault yet?"}{' '}
          <button
            className={styles.textButton}
            type="button"
            onClick={() => switchMode(isRegister ? 'login' : 'register')}
          >
            {isRegister ? 'Sign in here' : 'Create a new one'}
          </button>
        </p>
      </form>
    </section>
  );
}
