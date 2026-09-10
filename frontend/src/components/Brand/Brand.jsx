import noteAppMark from '../../assets/icons/note-app-mark.svg';
import styles from './Brand.module.css';

export function Brand() {
  return (
    <div className={styles.brand} aria-label="Note App">
      <img className={styles.mark} src={noteAppMark} alt="" aria-hidden="true" />
      <span>Note App</span>
    </div>
  );
}
