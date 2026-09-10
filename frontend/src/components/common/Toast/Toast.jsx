import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { appendToast } from '../feedback.js';
import styles from './Toast.module.css';

const ToastContext = createContext(null);
let nextToastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message, tone = 'success') => {
    const id = ++nextToastId;
    setToasts((current) => appendToast(current, { id, message, tone }));
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className={styles.viewport} aria-label="Workspace notifications">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

function Toast({ message, tone, onDismiss }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timeoutId);
  }, [onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span aria-hidden="true">{tone === 'error' ? '!' : '✓'}</span>
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  );
}
