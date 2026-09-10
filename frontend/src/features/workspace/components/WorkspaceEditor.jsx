import { Archive, ArrowLeft, FileText, RotateCcw, Star, Trash2 } from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { TagControls } from '../../tags/components/TagControls.jsx';
import { NoteEditor } from './NoteEditor.jsx';

export function WorkspaceEditor({
  styles,
  mobilePane,
  view,
  draft,
  noteLoading = false,
  noteError = null,
  notebooks,
  availableTags,
  tagsLoading,
  saveStatus,
  conflict,
  busy,
  onBack,
  onSave,
  onReload,
  onTrash,
  onFavorite,
  onArchive,
  onDraftChange,
  onTagsChange,
  onAssignNotebook,
  onCreateNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}) {
  return (
    <section className={`${styles.editor} ${mobilePane === 'collection' ? styles.mobileHidden : ''}`} aria-label="Note editor">
      <button className={styles.backToCollection} type="button" onClick={onBack}>
        <ArrowLeft className="icon" size={15} aria-hidden="true" />
        <span>Back to {view === 'notes' ? 'notes' : view}</span>
      </button>
      {noteLoading ? (
        <div className={styles.editorEmpty} aria-live="polite">Loading note...</div>
      ) : noteError ? (
        <Alert>{noteError.message ?? 'This note could not be loaded.'}</Alert>
      ) : draft ? (
        <>
          <div className={styles.editorHeader}>
            <span className={styles.saveStatus} aria-live="polite">{saveStatus}</span>
            <button className={styles.saveButton} onClick={onSave} disabled={saveStatus === 'Saved' || saveStatus === 'Saving'}>
              {saveStatus === 'Save Failed' ? <><RotateCcw className="icon" size={15} aria-hidden="true" /><span>Retry save</span></> : <><FileText className="icon" size={15} aria-hidden="true" /><span>Save</span></>}
            </button>
            {conflict && <button className={styles.secondaryButton} onClick={onReload}><RotateCcw className="icon" size={15} aria-hidden="true" /><span>Reload server copy</span></button>}
            <button className={styles.dangerButton} onClick={onTrash} disabled={busy || saveStatus === 'Saving'}><Trash2 className="icon" size={15} aria-hidden="true" /><span>Move to Trash</span></button>
            <button className={styles.secondaryButton} onClick={() => onFavorite(!draft.isFavorite)} disabled={busy}><Star className="icon" size={15} aria-hidden="true" /><span>{draft.isFavorite ? 'Unfavorite' : 'Favorite'}</span></button>
            <button className={styles.secondaryButton} onClick={() => onArchive(draft)} disabled={busy}><Archive className="icon" size={15} aria-hidden="true" /><span>{draft.state === 'archived' ? 'Unarchive' : 'Archive'}</span></button>
          </div>
          <input
            className={styles.titleInput}
            aria-label="Note title"
            value={draft.title}
            onChange={(event) => onDraftChange('title', event.target.value)}
            placeholder="Untitled note"
          />
          <TagControls
            noteId={draft.id}
            tags={draft.tags ?? []}
            availableTags={availableTags}
            tagsLoading={tagsLoading}
            onTagsChange={onTagsChange}
            disabled={busy || saveStatus === 'Saving'}
          />
          <div className={styles.notebookControls}>
            <label htmlFor="note-notebook">Notebook</label>
            <select id="note-notebook" value={draft.notebookId ?? ''} onChange={(event) => onAssignNotebook(event.target.value)} disabled={busy}>
              <option value="">No notebook</option>
              {notebooks.map((notebook) => <option value={notebook.id} key={notebook.id}>{notebook.name}</option>)}
            </select>
            <form onSubmit={onCreateNotebook} className={styles.newTagForm}>
              <input name="notebookName" aria-label="New notebook name" placeholder="New notebook" />
              <button className={styles.secondaryButton} type="submit">Create</button>
            </form>
            {notebooks.map((notebook) => (
              <span className={styles.notebookItem} key={notebook.id}>
                {notebook.name}
                <button type="button" className={styles.textButton} onClick={() => onRenameNotebook(notebook)}>Rename</button>
                <button type="button" className={styles.textButton} onClick={() => onDeleteNotebook(notebook)}>Delete</button>
              </span>
            ))}
          </div>
          <NoteEditor
            key={draft.id}
            content={draft.contentJson}
            onChange={(contentJson) => onDraftChange('contentJson', contentJson)}
          />
        </>
      ) : <div className={styles.editorEmpty}>Select a note or create a new one.</div>}
    </section>
  );
}
