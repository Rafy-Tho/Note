import { Menu } from 'lucide-react';
import { Brand } from '../../../components/Brand/Brand.jsx';

export function WorkspaceHeader({ email, menuOpen, onOpenMenu, styles }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarBrand}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
        >
          <Menu className="icon" size={17} aria-hidden="true" />
          <span>Menu</span>
        </button>
        <Brand />
      </div>
      <div className={styles.topbarActions}>
        <span className={styles.email}>{email}</span>
      </div>
    </header>
  );
}
