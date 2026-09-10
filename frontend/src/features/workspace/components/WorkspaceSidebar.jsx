import {
  Archive,
  FileText,
  Folder,
  Search,
  Star,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { WorkspaceAccountControls } from './WorkspaceAccountControls.jsx';
import { WorkspaceTagSection } from './WorkspaceTagSection.jsx';
import { WorkspaceNotebookSection } from './WorkspaceNotebookSection.jsx';

const navigation = [
  ['notes', 'Notes', FileText, 'notes'],
  ['favorites', 'Favorites', Star, 'favorites'],
  ['archive', 'Archive', Archive, 'archive'],
  ['notebooks', 'Notebooks', Folder, 'notebooks'],
  ['tags', 'Tags', Tags, 'tags'],
  ['search', 'Search', Search],
  ['trash', 'Trash', Trash2, 'trash'],
];

export function WorkspaceSidebar({
  styles,
  open,
  closeMenuRef,
  view,
  selectedTagId,
  selectedNotebookId,
  sidebarCounts,
  sidebarCountsError,
  canLeaveDraft,
  onClose,
  onSwitchView,
  onSelectTag,
  onSelectNotebook,
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
        {navigation.map(([navView, label, Icon, countKey]) => {
          const count = countKey ? sidebarCounts?.[countKey] : undefined;
          return (
            <button
              className={styles.navButton}
              type="button"
              key={navView}
              aria-current={view === navView ? 'page' : undefined}
              aria-label={
                count === undefined ? label : `${label}, ${count} notes`
              }
              onClick={() => onSwitchView(navView)}
            >
              <span className={styles.navLabel}>
                <Icon className="icon" size={16} aria-hidden="true" />
                <span>{label}</span>
              </span>
              <span className={styles.navMeta}>
                {count !== undefined && (
                  <span className={styles.countBadge}>{count}</span>
                )}
                {view === navView && <span aria-hidden="true">/</span>}
              </span>
            </button>
          );
        })}
      </nav>
      {sidebarCountsError && (
        <p className={styles.sidebarCountsError} role="status">
          Note counts are unavailable.
        </p>
      )}
      <WorkspaceNotebookSection
        styles={styles}
        counts={sidebarCounts?.notebookCounts}
        selectedNotebookId={selectedNotebookId}
        onSelectNotebook={onSelectNotebook}
      />
      <WorkspaceTagSection
        styles={styles}
        counts={sidebarCounts?.tagCounts}
        selectedTagId={selectedTagId}
        onSelectTag={onSelectTag}
      />
      <WorkspaceAccountControls styles={styles} canLeaveDraft={canLeaveDraft} />
    </aside>
  );
}
