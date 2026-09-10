import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { ToastProvider } from '../../../components/common/Toast/Toast.jsx';
import { WorkspaceHeader } from './WorkspaceHeader.jsx';
import { WorkspaceSidebar } from './WorkspaceSidebar.jsx';

export function WorkspaceShell({
  styles,
  view,
  selectedTagId,
  canLeaveDraft,
  onSwitchView,
  onSelectTag,
  children,
}) {
  const { session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    closeMenuRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  function switchView(nextView) {
    const accepted = onSwitchView(nextView);
    if (accepted !== false) setMenuOpen(false);
  }

  return (
    <ToastProvider>
      <WorkspaceHeader
        email={session.user.email}
        menuOpen={menuOpen}
        onOpenMenu={() => setMenuOpen(true)}
        styles={styles}
      />
      <div className={styles.layout}>
        {menuOpen && (
          <button
            className={styles.drawerBackdrop}
            type="button"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <WorkspaceSidebar
          styles={styles}
          open={menuOpen}
          closeMenuRef={closeMenuRef}
          view={view}
          selectedTagId={selectedTagId}
          canLeaveDraft={canLeaveDraft}
          onClose={() => setMenuOpen(false)}
          onSwitchView={switchView}
          onSelectTag={onSelectTag}
        />
        {children}
      </div>
    </ToastProvider>
  );
}
