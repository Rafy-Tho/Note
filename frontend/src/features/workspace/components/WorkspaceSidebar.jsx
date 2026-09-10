import { Archive, FileText, LogOut, Search, Star, Tags, Trash2, X } from 'lucide-react';

const navigation = [
  ['notes', 'Notes', FileText],
  ['favorites', 'Favorites', Star],
  ['archive', 'Archive', Archive],
  ['tags', 'Tags', Tags],
  ['search', 'Search', Search],
  ['trash', 'Trash', Trash2],
];

export function WorkspaceSidebar({
  styles,
  open,
  closeMenuRef,
  view,
  identities,
  identityLoading,
  busy,
  onClose,
  onSwitchView,
  onLinkProvider,
  onUnlinkProvider,
  onSignOut,
}) {
  return (
    <aside
      className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}
      aria-label="Workspace navigation"
    >
      <div className={styles.sidebarHeader}>
        <span className={styles.eyebrow}>Workspace</span>
        <button
          className={styles.closeMenuButton}
          type="button"
          ref={closeMenuRef}
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X className="icon" size={17} aria-hidden="true" />
          <span>Close</span>
        </button>
      </div>
      <nav className={styles.nav}>
        {navigation.map(([navView, label, Icon]) => (
          <button
            className={styles.navButton}
            type="button"
            key={navView}
            aria-current={view === navView ? 'page' : undefined}
            onClick={() => onSwitchView(navView)}
          >
            <span className={styles.navLabel}>
              <Icon className="icon" size={16} aria-hidden="true" />
              <span>{label}</span>
            </span>
            {view === navView && <span aria-hidden="true">/</span>}
          </button>
        ))}
      </nav>
      <div className={styles.accountControls}>
        <span className={styles.eyebrow}>Sign-in methods</span>
        {identityLoading ? (
          <span className={styles.accountHint}>Loading...</span>
        ) : (
          ['google', 'facebook'].map((provider) => {
            const linked = identities?.some((identity) => identity.provider === provider);
            return linked ? (
              <div className={styles.identityRow} key={provider}>
                <span>{provider}</span>
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={() => onUnlinkProvider(provider)}
                  disabled={busy}
                >
                  Unlink
                </button>
              </div>
            ) : (
              <button
                className={styles.identityButton}
                type="button"
                key={provider}
                onClick={() => onLinkProvider(provider)}
                disabled={busy}
              >
                Link {provider}
              </button>
            );
          })
        )}
      </div>
      <button className={styles.signOutButton} type="button" onClick={onSignOut} disabled={busy}>
        <LogOut className="icon" size={16} aria-hidden="true" />
        <span>{busy ? 'Signing out...' : 'Sign out'}</span>
      </button>
    </aside>
  );
}
