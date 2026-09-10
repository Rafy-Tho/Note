import { useState } from 'react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { useNoteMutations } from '../hooks/useNoteMutations.js';
import { useNotebookMutations } from '../hooks/useNotebookMutations.js';

export function NotebookControls({ styles, note, notebooks, onNoteUpdated }) {
  const noteMutations = useNoteMutations();
  const notebookMutations = useNotebookMutations();
  const [error, setError] = useState(null);
  const busy =
    noteMutations.assignNotebook.isPending ||
    notebookMutations.createNotebook.isPending ||
    notebookMutations.renameNotebook.isPending ||
    notebookMutations.deleteNotebook.isPending;

  async function assign(notebookId) {
    if (!note) return;
    setError(null);
    try {
      const updated = await noteMutations.assignNotebook.mutateAsync({
        noteId: note.id,
        notebookId: notebookId || null,
      });
      onNoteUpdated(updated);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function create(event) {
    event.preventDefault();
    setError(null);
    try {
      await notebookMutations.createNotebook.mutateAsync(
        event.currentTarget.elements.notebookName.value,
      );
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function rename(notebook) {
    const name = window.prompt('Rename notebook', notebook.name);
    if (!name || name === notebook.name) return;
    setError(null);
    try {
      await notebookMutations.renameNotebook.mutateAsync({
        notebookId: notebook.id,
        name,
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function remove(notebook) {
    if (
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
      <label htmlFor="note-notebook">Notebook</label>
      <select
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
      <form onSubmit={create} className={styles.newTagForm}>
        <input
          name="notebookName"
          aria-label="New notebook name"
          placeholder="New notebook"
          disabled={busy}
        />
        <button className={styles.secondaryButton} type="submit" disabled={busy}>
          Create
        </button>
      </form>
      {notebooks.map((notebook) => (
        <span className={styles.notebookItem} key={notebook.id}>
          {notebook.name}
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
            className={styles.textButton}
            onClick={() => void remove(notebook)}
            disabled={busy}
          >
            Delete
          </button>
        </span>
      ))}
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
