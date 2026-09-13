import noteAppMark from '../../../assets/icons/note-app-mark.svg';
import styles from './Brand.module.css';

export function Brand() {
  return (
    <div className={styles.brand} aria-label="Oqira">
      <img
        className={styles.mark}
        src={noteAppMark}
        alt=""
        aria-hidden="true"
      />
      <span>Oqira</span>
    </div>
  );
}
