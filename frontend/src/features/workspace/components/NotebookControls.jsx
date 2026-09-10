import { useState } from 'react';
import { Folder, Plus, Settings2 } from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { useNoteMutations } from '../hooks/useNoteMutations.js';
import { useNotebookMutations } from '../hooks/useNotebookMutations.js';

export function NotebookControls({
  styles,
  note,
  notebooks,
  onNoteUpdated,
  disabled = false,
}) {
  const noteMutations = useNoteMutations();
  const notebookMutations = useNotebookMutations();
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const mutationBusy =
    noteMutations.assignNotebook.isPending ||
    notebookMutations.createNotebook.isPending ||
    notebookMutations.renameNotebook.isPending ||
    notebookMutations.deleteNotebook.isPending;
  const busy = disabled || mutationBusy;

  async function assign(notebookId) {
    if (!note || disabled || noteMutations.assignNotebook.isPending)
      return false;
    setError(null);
    try {
      const updated = await noteMutations.assignNotebook.mutateAsync({
        noteId: note.id,
        notebookId: notebookId || null,
      });
      onNoteUpdated(updated);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function create(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.notebookName.value.trim();
    if (!name || busy) return;
    setError(null);
    try {
      const created = await notebookMutations.createNotebook.mutateAsync(name);
      const assigned = created?.id ? await assign(created.id) : true;
      if (assigned) {
        form.reset();
        setShowCreate(false);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function rename(notebook) {
    const name = window.prompt('Rename notebook', notebook.name);
    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName === notebook.name || busy) return;
    setError(null);
    try {
      await notebookMutations.renameNotebook.mutateAsync({
        notebookId: notebook.id,
        name: trimmedName,
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function remove(notebook) {
    if (
      busy ||
      !window.confirm(
        `Delete notebook "${notebook.name}"? Notes will be unassigned.`,
      )
    )
      return;
    setError(null);
    try {
      await notebookMutations.deleteNotebook.mutateAsync(notebook.id);
      if (note.notebookId === notebook.id) await assign('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className={styles.notebookControls}>
      <label className={styles.contextLabel} htmlFor="note-notebook">
        <Folder className="icon" size={14} aria-hidden="true" />
        <span>Notebook</span>
      </label>
      <select
        className={styles.contextSelect}
        id="note-notebook"
        value={note.notebookId ?? ''}
        onChange={(event) => void assign(event.target.value)}
        disabled={busy}
      >
        <option value="">No notebook</option>
        {notebooks.map((notebook) => (
          <option value={notebook.id} key={notebook.id}>
            {notebook.name}
          </option>
        ))}
      </select>
      <button
        className={styles.contextButton}
        type="button"
        onClick={() => setShowCreate((current) => !current)}
        aria-expanded={showCreate}
        aria-controls={`notebook-create-${note.id}`}
        aria-label="Create new notebook"
        disabled={busy}
      >
        <Plus className="icon" size={14} aria-hidden="true" />
        <span>New</span>
      </button>
      <button
        className={styles.contextButton}
        type="button"
        onClick={() => setShowManage((current) => !current)}
        aria-expanded={showManage}
        aria-controls={`notebook-manage-${note.id}`}
        disabled={busy || notebooks.length === 0}
      >
        <Settings2 className="icon" size={14} aria-hidden="true" />
        <span>Manage</span>
      </button>
      {showCreate && (
        <form
          className={styles.contextCreateForm}
          id={`notebook-create-${note.id}`}
          onSubmit={create}
        >
          <label className={styles.visuallyHidden} htmlFor="new-notebook-name">
            New notebook name
          </label>
          <input
            id="new-notebook-name"
            name="notebookName"
            placeholder="New notebook"
            autoComplete="off"
            disabled={busy}
          />
          <button
            className={styles.secondaryButton}
            type="submit"
            disabled={busy}
          >
            Create
          </button>
        </form>
      )}
      {showManage && (
        <div
          className={styles.notebookManage}
          id={`notebook-manage-${note.id}`}
          aria-label="Manage notebooks"
        >
          {notebooks.map((notebook) => (
            <div className={styles.notebookItem} key={notebook.id}>
              <span>{notebook.name}</span>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => void rename(notebook)}
                disabled={busy}
              >
                Rename
              </button>
              <button
                type="button"
                className={`${styles.textButton} ${styles.textDanger}`}
                onClick={() => void remove(notebook)}
                disabled={busy}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
