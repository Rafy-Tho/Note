import { List, Menu } from 'lucide-react';
import { Brand } from '../../../components/common/Brand/Brand.jsx';

export function WorkspaceHeader({
  email,
  menuOpen,
  collectionOpen,
  onOpenMenu,
  onOpenCollection,
  styles,
}) {
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
        <button
          className={styles.collectionButton}
          type="button"
          aria-label={collectionOpen ? 'Close notes list' : 'Open notes list'}
          aria-expanded={collectionOpen}
          onClick={onOpenCollection}
        >
          <List className="icon" size={17} aria-hidden="true" />
          <span>{collectionOpen ? 'Close notes' : 'Notes'}</span>
        </button>
        <Brand />
      </div>
      <div className={styles.topbarActions}>
        <span className={styles.email}>{email}</span>
      </div>
    </header>
  );
}
