import styles from './Alert.module.css';

export function Alert({ children, tone = 'error' }) {
  const isError = tone === 'error';

  return (
    <div
      className={`${styles.alert} ${isError ? styles.error : styles.success}`}
      role={isError ? 'alert' : 'status'}
    >
      <span aria-hidden="true">{isError ? '!' : '✓'}</span>
      <span>{children}</span>
    </div>
  );
}
