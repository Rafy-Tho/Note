import { Archive, FileText, Folder, Search, Star, Tags, Trash2, X } from 'lucide-react';
import { WorkspaceAccountControls } from './WorkspaceAccountControls.jsx';
import { WorkspaceTagSection } from './WorkspaceTagSection.jsx';
import { WorkspaceNotebookSection } from './WorkspaceNotebookSection.jsx';

const navigation = [
  ['notes', 'Notes', FileText],
  ['favorites', 'Favorites', Star],
  ['archive', 'Archive', Archive],
  ['notebooks', 'Notebooks', Folder],
  ['tags', 'Tags', Tags],
  ['search', 'Search', Search],
  ['trash', 'Trash', Trash2],
];

export function WorkspaceSidebar({
  styles,
  open,
  closeMenuRef,
  view,
  selectedTagId,
  canLeaveDraft,
  onClose,
  onSwitchView,
  onSelectTag,
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
      <WorkspaceNotebookSection styles={styles} />
      <WorkspaceTagSection
        styles={styles}
        selectedTagId={selectedTagId}
        onSelectTag={onSelectTag}
      />
      <WorkspaceAccountControls
        styles={styles}
        canLeaveDraft={canLeaveDraft}
      />
    </aside>
  );
}
