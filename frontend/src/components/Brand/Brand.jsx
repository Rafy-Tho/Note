import styles from './Brand.module.css';

export function Brand() {
  return (
    <div className={styles.brand} aria-label="Note App">
      <div className={styles.mark} aria-hidden="true">
        <span />
        <span />
        <span />
        <i />
      </div>
      <span>Note App</span>
    </div>
  );
}
