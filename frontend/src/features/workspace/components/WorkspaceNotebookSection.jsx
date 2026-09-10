import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Folder, MoreHorizontal, Plus } from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { Dialog } from '../../../components/common/Dialog/Dialog.jsx';
import { useToast } from '../../../components/common/Toast/Toast.jsx';
import { useNotebookMutations } from '../hooks/useNotebookMutations.js';
import { useWorkspaceNotebooksQuery } from '../hooks/useWorkspaceQueries.js';

export function WorkspaceNotebookSection({ styles, expanded: expandedProp, onExpandedChange }) {
  const notebooksQuery = useWorkspaceNotebooksQuery();
  const notebookMutations = useNotebookMutations();
  const { notify } = useToast();
  const renameInputRef = useRef(null);
  const [localExpanded, setLocalExpanded] = useState(true);
  const [menuNotebookId, setMenuNotebookId] = useState(null);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const notebooks = notebooksQuery.data ?? [];
  const expanded = expandedProp ?? localExpanded;
  const busy =
    notebooksQuery.isFetching ||
    notebookMutations.createNotebook.isPending ||
    notebookMutations.renameNotebook.isPending ||
    notebookMutations.deleteNotebook.isPending;

  function openRename(notebook) {
    setMenuNotebookId(null);
    setRenameTarget(notebook);
    setRenameName(notebook.name);
  }

  async function createNotebook(event) {
    event.preventDefault();
    const name = event.currentTarget.elements.notebookName.value.trim();
    if (!name || busy) return;
    setError(null);
    try {
      await notebookMutations.createNotebook.mutateAsync(name);
      await notebooksQuery.refetch();
      setCreateOpen(false);
      notify('Notebook created.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function renameNotebook(event) {
    event.preventDefault();
    const name = renameName.trim();
    if (!renameTarget || !name || name === renameTarget.name || busy) return;
    setError(null);
    try {
      await notebookMutations.renameNotebook.mutateAsync({
        notebookId: renameTarget.id,
        name,
      });
      await notebooksQuery.refetch();
      setRenameTarget(null);
      notify('Notebook renamed.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteNotebook() {
    if (!deleteTarget || busy) return;
    setError(null);
    try {
      await notebookMutations.deleteNotebook.mutateAsync(deleteTarget.id);
      await notebooksQuery.refetch();
      setDeleteTarget(null);
      notify('Notebook deleted.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className={styles.sidebarTags} aria-label="Notebooks">
      <div className={styles.sidebarSectionHeader}>
        <button
          className={styles.sidebarSectionToggle}
          type="button"
          aria-expanded={expanded}
          aria-controls="workspace-sidebar-notebooks"
          onClick={() => {
            const nextExpanded = !expanded;
            setLocalExpanded(nextExpanded);
            onExpandedChange?.(nextExpanded);
          }}
        >
          {expanded ? <ChevronDown className="icon" size={14} aria-hidden="true" /> : <ChevronRight className="icon" size={14} aria-hidden="true" />}
          <Folder className="icon" size={14} aria-hidden="true" />
          <span>Notebooks</span>
        </button>
        <button
          className={styles.sidebarAddButton}
          type="button"
          aria-label="Create notebook"
          onClick={() => setCreateOpen(true)}
          disabled={busy}
        >
          <Plus className="icon" size={14} aria-hidden="true" />
        </button>
      </div>
      {expanded && (
        <div className={styles.sidebarTagList} id="workspace-sidebar-notebooks">
          {error && <Alert>{error}</Alert>}
          {notebooksQuery.isLoading ? (
            <span className={styles.sidebarTagEmpty}>Loading notebooks...</span>
          ) : notebooksQuery.error ? (
            <Alert>{notebooksQuery.error.message}</Alert>
          ) : notebooks.length === 0 ? (
            <span className={styles.sidebarTagEmpty}>No notebooks yet.</span>
          ) : (
            notebooks.map((notebook) => (
              <div className={styles.sidebarTagRow} key={notebook.id}>
                <span className={styles.sidebarNotebookLabel}>
                  <Folder className="icon" size={13} aria-hidden="true" />
                  {notebook.name}
                </span>
                <button
                  className={styles.sidebarTagMenuButton}
                  type="button"
                  aria-label={`Manage ${notebook.name} notebook`}
                  aria-expanded={menuNotebookId === notebook.id}
                  onClick={() => setMenuNotebookId((current) => (current === notebook.id ? null : notebook.id))}
                >
                  <MoreHorizontal className="icon" size={14} aria-hidden="true" />
                </button>
                {menuNotebookId === notebook.id && (
                  <div className={styles.sidebarTagMenu} role="menu">
                    <button type="button" role="menuitem" onClick={() => openRename(notebook)}>Rename</button>
                    <button type="button" role="menuitem" onClick={() => { setMenuNotebookId(null); setDeleteTarget(notebook); }}>Delete</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      {createOpen && (
        <Dialog
          title="Create notebook"
          description="Create a notebook to group related notes."
          onClose={() => setCreateOpen(false)}
          actions={<><button className={styles.secondaryButton} type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className={styles.primaryButton} type="submit" form="sidebar-create-notebook">Create notebook</button></>}
        >
          <form id="sidebar-create-notebook" onSubmit={createNotebook}>
            <label htmlFor="sidebar-notebook-name">Notebook name</label>
            <input id="sidebar-notebook-name" name="notebookName" autoComplete="off" autoFocus />
          </form>
        </Dialog>
      )}
      {renameTarget && (
        <Dialog
          title="Rename notebook"
          description="Choose a new name for this notebook."
          onClose={() => setRenameTarget(null)}
          initialFocusRef={renameInputRef}
          actions={<><button className={styles.secondaryButton} type="button" onClick={() => setRenameTarget(null)}>Cancel</button><button className={styles.primaryButton} type="submit" form="sidebar-rename-notebook">Rename</button></>}
        >
          <form id="sidebar-rename-notebook" onSubmit={renameNotebook}>
            <label htmlFor="sidebar-rename-notebook-name">Notebook name</label>
            <input ref={renameInputRef} id="sidebar-rename-notebook-name" value={renameName} onChange={(event) => setRenameName(event.target.value)} autoComplete="off" />
          </form>
        </Dialog>
      )}
      {deleteTarget && (
        <Dialog
          title={`Delete ${deleteTarget.name}?`}
          description="Notes in this notebook will remain in your workspace without a notebook."
          onClose={() => setDeleteTarget(null)}
          actions={<><button className={styles.secondaryButton} type="button" onClick={() => setDeleteTarget(null)}>Cancel</button><button className={styles.dangerButton} type="button" onClick={() => void deleteNotebook()}>Delete notebook</button></>}
        />
      )}
    </section>
  );
}
