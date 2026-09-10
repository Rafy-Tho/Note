import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Archive, ArrowLeft, FileText, RotateCcw, Star, Trash2 } from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { TagControls } from '../../tags/components/TagControls.jsx';
import { useAutosave } from '../hooks/useAutosave.js';
import { useNoteMutations } from '../hooks/useNoteMutations.js';
import {
  useWorkspaceNoteQuery,
  useWorkspaceNotebooksQuery,
  useWorkspaceTagsQuery,
  workspaceQueryKeys,
} from '../hooks/useWorkspaceQueries.js';
import { NotebookControls } from './NotebookControls.jsx';
import { NoteEditor } from './NoteEditor.jsx';

export function WorkspaceEditor({
  styles,
  mobilePane,
  view,
  noteId,
  canLeaveDraft,
  allowNextNavigation,
  onBack,
  onEditorStateChange,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const noteQuery = useWorkspaceNoteQuery(noteId);
  const notebooksQuery = useWorkspaceNotebooksQuery();
  const tagsQuery = useWorkspaceTagsQuery();
  const noteMutations = useNoteMutations();
  const [error, setError] = useState(null);
  const note = noteQuery.data ?? null;
  const notebooks = notebooksQuery.data ?? [];
  const availableTags = tagsQuery.data ?? [];
  const saveNote = useCallback(
    (snapshot) =>
      noteMutations.updateNote.mutateAsync({
        noteId: snapshot.id,
        note: {
          title: snapshot.title,
          contentJson: snapshot.contentJson,
          revision: snapshot.revision,
        },
      }),
    [noteMutations.updateNote.mutateAsync],
  );
  const handleAutosaveError = useCallback(
    (requestError) => setError(requestError.message),
    [],
  );
  const autosave = useAutosave({
    note,
    saveNote,
    onError: handleAutosaveError,
  });
  const {
    draft,
    updateDraft,
    replaceDraft,
    save: saveDraft,
    saveStatus,
    isDirty,
    isSaving,
    conflict,
  } = autosave;
  const mutationBusy =
    noteMutations.trashNote.isPending ||
    noteMutations.favoriteNote.isPending ||
    noteMutations.archiveNote.isPending;
  const busy = isSaving || mutationBusy;

  useEffect(() => {
    onEditorStateChange({ isDirty, isSaving });
  }, [isDirty, isSaving, onEditorStateChange]);

  function changeDraft(field, value) {
    updateDraft(field, value);
    setError(null);
  }

  function updateTags(tags) {
    if (draft) replaceDraft({ ...draft, tags });
  }

  function updateFromServer(updated) {
    if (!draft) return;
    const nextDraft = isDirty
      ? {
          ...updated,
          title: draft.title,
          contentJson: draft.contentJson,
          tags: draft.tags,
        }
      : updated;
    replaceDraft(nextDraft, { dirty: isDirty });
    queryClient.setQueryData(workspaceQueryKeys.note(updated.id), updated);
  }

  async function trashCurrentNote() {
    if (
      !draft ||
      isSaving ||
      !canLeaveDraft() ||
      !window.confirm('Move this note to Trash?')
    )
      return;
    setError(null);
    try {
      await noteMutations.trashNote.mutateAsync(draft.id);
      allowNextNavigation();
      navigate('/workspace/notes');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function setNoteFavorite(isFavorite) {
    if (!draft || busy) return;
    setError(null);
    try {
      const updated = await noteMutations.favoriteNote.mutateAsync({
        noteId: draft.id,
        favorite: isFavorite,
      });
      updateFromServer(updated);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changeArchive() {
    if (!draft || busy || !canLeaveDraft()) return;
    setError(null);
    try {
      const updated = await noteMutations.archiveNote.mutateAsync({
        noteId: draft.id,
        archived: draft.state === 'archived',
      });
      allowNextNavigation();
      navigate(
        updated.state === 'active'
          ? `/workspace/notes/${updated.id}`
          : `/workspace/archive/${updated.id}`,
      );
      queryClient.setQueryData(workspaceQueryKeys.note(updated.id), updated);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function reloadServerCopy() {
    if (!draft) return;
    setError(null);
    try {
      const result = await noteQuery.refetch();
      if (result.error) throw result.error;
      if (result.data) replaceDraft(result.data);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const noteError = noteId ? noteQuery.error : null;
  const noteLoading = Boolean(noteId && noteQuery.isLoading);

  return (
    <section
      className={`${styles.editor} ${mobilePane === 'collection' ? styles.mobileHidden : ''}`}
      aria-label="Note editor"
    >
      <button className={styles.backToCollection} type="button" onClick={onBack}>
        <ArrowLeft className="icon" size={15} aria-hidden="true" />
        <span>Back to {view === 'notes' ? 'notes' : view}</span>
      </button>
      {error && <Alert>{error}</Alert>}
      {noteLoading ? (
        <div className={styles.editorEmpty} aria-live="polite">
          Loading note...
        </div>
      ) : noteError ? (
        <Alert>{noteError.message ?? 'This note could not be loaded.'}</Alert>
      ) : draft ? (
        <>
          <div className={styles.editorHeader}>
            <span className={styles.saveStatus} aria-live="polite">
              {saveStatus}
            </span>
            <button
              className={styles.saveButton}
              type="button"
              onClick={() => void saveDraft()}
              disabled={saveStatus === 'Saved' || saveStatus === 'Saving'}
            >
              {saveStatus === 'Save Failed' ? (
                <>
                  <RotateCcw className="icon" size={15} aria-hidden="true" />
                  <span>Retry save</span>
                </>
              ) : (
                <>
                  <FileText className="icon" size={15} aria-hidden="true" />
                  <span>Save</span>
                </>
              )}
            </button>
            {conflict && (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => void reloadServerCopy()}
              >
                <RotateCcw className="icon" size={15} aria-hidden="true" />
                <span>Reload server copy</span>
              </button>
            )}
            <button
              className={styles.dangerButton}
              type="button"
              onClick={() => void trashCurrentNote()}
              disabled={busy}
            >
              <Trash2 className="icon" size={15} aria-hidden="true" />
              <span>Move to Trash</span>
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => void setNoteFavorite(!draft.isFavorite)}
              disabled={busy}
            >
              <Star className="icon" size={15} aria-hidden="true" />
              <span>{draft.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => void changeArchive()}
              disabled={busy}
            >
              <Archive className="icon" size={15} aria-hidden="true" />
              <span>{draft.state === 'archived' ? 'Unarchive' : 'Archive'}</span>
            </button>
          </div>
          <input
            className={styles.titleInput}
            aria-label="Note title"
            value={draft.title}
            onChange={(event) => changeDraft('title', event.target.value)}
            placeholder="Untitled note"
          />
          <TagControls
            noteId={draft.id}
            tags={draft.tags ?? []}
            availableTags={availableTags}
            tagsLoading={tagsQuery.isLoading}
            onTagsChange={updateTags}
            disabled={busy || saveStatus === 'Saving'}
          />
          <NotebookControls
            styles={styles}
            note={draft}
            notebooks={notebooks}
            onNoteUpdated={updateFromServer}
          />
          <NoteEditor
            key={draft.id}
            content={draft.contentJson}
            onChange={(contentJson) => changeDraft('contentJson', contentJson)}
          />
        </>
      ) : (
        <div className={styles.editorEmpty}>Select a note or create a new one.</div>
      )}
    </section>
  );
}
