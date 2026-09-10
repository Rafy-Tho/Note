import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { Dialog } from '../../../components/common/Dialog/Dialog.jsx';
import { useToast } from '../../../components/common/Toast/Toast.jsx';
import { documentText } from '../../notes/noteDocument.js';
import { useNoteMutations } from '../hooks/useNoteMutations.js';
import {
  useWorkspaceTrashQuery,
  workspaceQueryKeys,
} from '../hooks/useWorkspaceQueries.js';

export function WorkspaceTrash({ styles }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const trashQuery = useWorkspaceTrashQuery(true);
  const { restoreNote, permanentlyDelete } = useNoteMutations();
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { notify } = useToast();
  const busy = restoreNote.isPending || permanentlyDelete.isPending;
  const notes = trashQuery.data ?? [];

  async function restore(note) {
    setError(null);
    try {
      const restored = await restoreNote.mutateAsync(note.id);
      notify('Note restored.');
      queryClient.setQueryData(
        workspaceQueryKeys.note(restored.id),
        restored,
      );
      navigate(
        restored.state === 'archived'
          ? `/workspace/archive/${restored.id}`
          : `/workspace/notes/${restored.id}`,
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function permanentlyRemove(note) {
    setDeleteTarget(note);
  }

  async function confirmPermanentRemove() {
    if (!deleteTarget) return;
    setError(null);
    try {
      await permanentlyDelete.mutateAsync(deleteTarget.id);
      notify('Note permanently deleted.');
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (trashQuery.isLoading) {
    return (
      <div className={styles.empty} aria-live="polite">
        Loading Trash...
      </div>
    );
  }

  if (trashQuery.error) {
    return <Alert>{trashQuery.error.message}</Alert>;
  }

  return (
    <>
      {error && <Alert>{error}</Alert>}
      {notes.length === 0 ? (
        <div className={styles.empty}>
          <h2>Trash is empty.</h2>
          <p>Notes moved here can be restored later.</p>
        </div>
      ) : (
        <div className={styles.noteList} aria-label="Trashed notes">
          {notes.map((note) => (
            <div className={styles.noteRow} key={note.id}>
              <strong>{note.title || 'Untitled note'}</strong>
              <span>{documentText(note.contentJson).slice(0, 72) || 'Blank note'}</span>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => void restore(note)}
                disabled={busy}
              >
                <RotateCcw className="icon" size={15} aria-hidden="true" />
                <span>Restore</span>
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                onClick={() => void permanentlyRemove(note)}
                disabled={busy}
              >
                <Trash2 className="icon" size={15} aria-hidden="true" />
                <span>Delete permanently</span>
              </button>
            </div>
          ))}
        </div>
      )}
      {deleteTarget && (
        <Dialog
          title="Delete note permanently?"
          description="This cannot be undone. The note and its content will be removed from Trash."
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button className={styles.secondaryButton} type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className={styles.dangerButton} type="button" onClick={() => void confirmPermanentRemove()}>
                Delete permanently
              </button>
            </>
          }
        />
      )}
    </>
  );
}
