import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { ToastProvider } from '../../../components/common/Toast/Toast.jsx';
import { WorkspaceHeader } from './WorkspaceHeader.jsx';
import { WorkspaceSidebar } from './WorkspaceSidebar.jsx';
import { useWorkspaceSidebarCountsQuery } from '../hooks/useWorkspaceQueries.js';

export function WorkspaceShell({
  styles,
  view,
  selectedTagId,
  selectedNotebookId,
  canLeaveDraft,
  onSwitchView,
  onSelectTag,
  onSelectNotebook,
  collectionOpen,
  onOpenCollection,
  onCloseCollection,
  children,
}) {
  const { session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigationCollapsed, setNavigationCollapsed] = useState(false);
  const [collectionCollapsed, setCollectionCollapsed] = useState(false);
  const closeMenuRef = useRef(null);
  const sidebarCountsQuery = useWorkspaceSidebarCountsQuery();

  useEffect(() => {
    if (!menuOpen && !collectionOpen) return undefined;
    if (menuOpen) closeMenuRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        onCloseCollection();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collectionOpen, menuOpen, onCloseCollection]);

  function switchView(nextView) {
    const accepted = onSwitchView(nextView);
    if (accepted !== false) {
      setMenuOpen(false);
      onCloseCollection();
    }
  }

  function openNavigation() {
    if (window.matchMedia('(max-width: 760px)').matches) {
      onCloseCollection();
      setMenuOpen((current) => !current);
      return;
    }
    setNavigationCollapsed((current) => !current);
  }

  function toggleCollection() {
    if (window.matchMedia('(max-width: 760px)').matches) {
      setMenuOpen(false);
      onOpenCollection();
      return;
    }
    setCollectionCollapsed((current) => !current);
  }

  return (
    <ToastProvider>
      <WorkspaceHeader
        email={session.user.email}
        menuOpen={menuOpen || !navigationCollapsed}
        collectionOpen={collectionOpen || !collectionCollapsed}
        onOpenMenu={openNavigation}
        onOpenCollection={toggleCollection}
        styles={styles}
      />
      <div
        className={`${styles.layout} ${navigationCollapsed ? styles.navigationCollapsed : ''} ${collectionCollapsed ? styles.collectionCollapsed : ''}`}
      >
        {(menuOpen || collectionOpen) && (
          <button
            className={styles.drawerBackdrop}
            type="button"
            aria-label="Close navigation"
            onClick={() => {
              setMenuOpen(false);
              onCloseCollection();
            }}
          />
        )}
        <WorkspaceSidebar
          styles={styles}
          open={menuOpen}
          closeMenuRef={closeMenuRef}
          view={view}
          selectedTagId={selectedTagId}
          selectedNotebookId={selectedNotebookId}
          sidebarCounts={sidebarCountsQuery.data}
          sidebarCountsError={sidebarCountsQuery.error}
          canLeaveDraft={canLeaveDraft}
          onClose={() => setMenuOpen(false)}
          onSwitchView={switchView}
          onSelectTag={onSelectTag}
          onSelectNotebook={onSelectNotebook}
        />
        {children}
      </div>
    </ToastProvider>
  );
}
