import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from '../../../components/Alert/Alert.jsx';
import { Brand } from '../../../components/Brand/Brand.jsx';
import { authApi } from '../../auth/api/authApi.js';
import { notesApi } from '../../notes/api/notesApi.js';
import { documentText } from '../../notes/noteDocument.js';
import { NoteEditor } from './NoteEditor.jsx';
import styles from './Workspace.module.css';

const EMPTY_DOCUMENT = { type: 'doc', content: [] };

function draftSignature(note) {
  return JSON.stringify({ title: note.title, contentJson: note.contentJson });
}

export function Workspace({ session, onSignOut }) {
  const [notes, setNotes] = useState([]);
  const [trashNotes, setTrashNotes] = useState([]);
  const [view, setView] = useState('notes');
  const [trashStatus, setTrashStatus] = useState('ready');
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState('loading');
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const latestDraftRef = useRef(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    notesApi
      .list()
      .then((data) => {
        setNotes(data);
        setSelected(data[0] ?? null);
        setStatus('ready');
      })
      .catch((requestError) => {
        setError(requestError.message);
        setStatus('ready');
      });
  }, []);

  useEffect(() => {
    if (view !== 'trash') return;
    setTrashStatus('loading');
    notesApi
      .listTrash()
      .then((data) => {
        setTrashNotes(data);
        setTrashStatus('ready');
      })
      .catch((requestError) => {
        setError(requestError.message);
        setTrashStatus('ready');
      });
  }, [view]);

  useEffect(() => {
    setDraft(selected);
    latestDraftRef.current = selected;
    dirtyRef.current = false;
    queuedRef.current = false;
    setSaveStatus('Saved');
    setConflict(false);
  }, [selected]);

  const saveDraft = useCallback(
    async (requestedDraft = latestDraftRef.current) => {
      if (!requestedDraft || !dirtyRef.current) return;
      if (savingRef.current) {
        queuedRef.current = true;
        return;
      }

      savingRef.current = true;
      setSaveStatus('Saving');
      setError(null);
      setConflict(false);
      const snapshot = requestedDraft;

      try {
        const updated = await notesApi.update(snapshot.id, {
          title: snapshot.title,
          contentJson: snapshot.contentJson,
          revision: snapshot.revision,
        });
        setNotes((current) =>
          current.map((note) => (note.id === updated.id ? updated : note)),
        );

        const latest = latestDraftRef.current;
        const changedWhileSaving =
          latest && draftSignature(latest) !== draftSignature(snapshot);
        const nextDraft = changedWhileSaving
          ? { ...latest, revision: updated.revision }
          : updated;
        latestDraftRef.current = nextDraft;
        setDraft(nextDraft);
        dirtyRef.current = Boolean(changedWhileSaving);
        setSaveStatus(changedWhileSaving ? 'Unsaved Changes' : 'Saved');
      } catch (requestError) {
        setError(requestError.message);
        setConflict(requestError.code === 'CONFLICT');
        setSaveStatus('Save Failed');
      } finally {
        savingRef.current = false;
        if (dirtyRef.current && queuedRef.current) {
          queuedRef.current = false;
          void saveDraft(latestDraftRef.current);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!draft || !dirtyRef.current) return undefined;
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void saveDraft(latestDraftRef.current);
    }, 800);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [draft, saveDraft]);

  function changeDraft(field, value) {
    const nextDraft = { ...latestDraftRef.current, [field]: value };
    latestDraftRef.current = nextDraft;
    dirtyRef.current = true;
    setDraft(nextDraft);
    setSaveStatus('Unsaved Changes');
    setError(null);
    setConflict(false);
  }

  async function createNote() {
    if (
      dirtyRef.current &&
      !window.confirm('You have unsaved changes. Create a new note anyway?')
    )
      return;
    if (savingRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const note = await notesApi.create({
        title: '',
        contentJson: EMPTY_DOCUMENT,
      });
      setNotes((current) => [note, ...current]);
      setSelected(note);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function selectNote(note) {
    if (savingRef.current) return;
    if (
      dirtyRef.current &&
      !window.confirm('You have unsaved changes. Switch notes anyway?')
    )
      return;
    setSelected(note);
  }

  function switchView(nextView) {
    if (nextView === view) return;
    if (savingRef.current) return;
    if (
      dirtyRef.current &&
      !window.confirm('You have unsaved changes. Switch views anyway?')
    )
      return;
    setView(nextView);
    setSelected(nextView === 'trash' ? null : (notes[0] ?? null));
  }

  async function trashCurrentNote() {
    if (!draft || savingRef.current) return;
    if (!window.confirm('Move this note to Trash?')) return;
    setBusy(true);
    setError(null);
    try {
      await notesApi.trash(draft.id);
      const remaining = notes.filter((note) => note.id !== draft.id);
      setNotes(remaining);
      setSelected(remaining[0] ?? null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function restoreNote(note) {
    setBusy(true);
    setError(null);
    try {
      const restored = await notesApi.restore(note.id);
      setTrashNotes((current) =>
        current.filter((currentNote) => currentNote.id !== restored.id),
      );
      setNotes((current) => [restored, ...current]);
      setView('notes');
      setSelected(restored);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function reloadServerCopy() {
    if (!draft) return;
    try {
      const serverNote = await notesApi.get(draft.id);
      setSelected(serverNote);
      setNotes((current) =>
        current.map((note) => (note.id === serverNote.id ? serverNote : note)),
      );
      setError(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function signOut() {
    if (
      dirtyRef.current &&
      !window.confirm('You have unsaved changes. Sign out anyway?')
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await authApi.logout();
      onSignOut();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading')
    return (
      <main className={styles.loading} aria-live="polite">
        Loading your notes...
      </main>
    );

  return (
    <main className={styles.workspace} aria-labelledby="workspace-title">
      <header className={styles.topbar}>
        <Brand />
        <div className={styles.topbarActions}>
          <span className={styles.email}>{session.user.email}</span>
          <button
            className={styles.secondaryButton}
            onClick={() => switchView('notes')}
            aria-pressed={view === 'notes'}
          >
            Notes
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => switchView('trash')}
            aria-pressed={view === 'trash'}
          >
            Trash
          </button>
          <button
            className={styles.secondaryButton}
            onClick={signOut}
            disabled={busy}
          >
            {busy ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </header>
      <div className={styles.layout}>
        <section
          className={styles.collection}
          aria-labelledby="workspace-title"
        >
          <div className={styles.collectionHeader}>
            <div>
              <p className={styles.eyebrow}>Private notes</p>
              <h1 id="workspace-title">
                {view === 'trash' ? 'Trash' : 'Notes'}
              </h1>
            </div>
            {view === 'notes' && (
              <button
                className={styles.primaryButton}
                onClick={createNote}
                disabled={busy}
              >
                + New note
              </button>
            )}
          </div>
          {error && <Alert>{error}</Alert>}
          {view === 'trash' && trashStatus === 'loading' ? (
            <div className={styles.empty} aria-live="polite">
              Loading Trash...
            </div>
          ) : view === 'trash' && trashNotes.length === 0 ? (
            <div className={styles.empty}>
              <h2>Trash is empty.</h2>
              <p>Notes moved here can be restored later.</p>
            </div>
          ) : view === 'trash' ? (
            <div className={styles.noteList} aria-label="Trashed notes">
              {trashNotes.map((note) => (
                <div className={styles.noteRow} key={note.id}>
                  <strong>{note.title || 'Untitled note'}</strong>
                  <span>
                    {documentText(note.contentJson).slice(0, 72) ||
                      'Blank note'}
                  </span>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => restoreNote(note)}
                    disabled={busy}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className={styles.empty}>
              <h2>Your workspace is clear.</h2>
              <p>Create a note to begin capturing your thoughts.</p>
            </div>
          ) : (
            <div className={styles.noteList} aria-label="Your notes">
              {notes.map((note) => (
                <button
                  className={`${styles.noteRow} ${selected?.id === note.id ? styles.selected : ''}`}
                  key={note.id}
                  onClick={() => selectNote(note)}
                >
                  <strong>{note.title || 'Untitled note'}</strong>
                  <span>
                    {documentText(note.contentJson).slice(0, 72) ||
                      'Blank note'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
        <section className={styles.editor} aria-label="Note editor">
          {draft ? (
            <>
              <div className={styles.editorHeader}>
                <span className={styles.saveStatus} aria-live="polite">
                  {saveStatus}
                </span>
                <button
                  className={styles.saveButton}
                  onClick={() => void saveDraft()}
                  disabled={saveStatus === 'Saved' || saveStatus === 'Saving'}
                >
                  {saveStatus === 'Save Failed' ? 'Retry save' : 'Save'}
                </button>
                {conflict && (
                  <button
                    className={styles.secondaryButton}
                    onClick={reloadServerCopy}
                  >
                    Reload server copy
                  </button>
                )}
                <button
                  className={styles.dangerButton}
                  onClick={trashCurrentNote}
                  disabled={busy || saveStatus === 'Saving'}
                >
                  Move to Trash
                </button>
              </div>
              <input
                className={styles.titleInput}
                aria-label="Note title"
                value={draft.title}
                onChange={(event) => changeDraft('title', event.target.value)}
                onBlur={() => void saveDraft()}
                placeholder="Untitled note"
              />
              <div onBlur={() => void saveDraft()}>
                <NoteEditor
                  content={draft.contentJson}
                  onChange={(contentJson) =>
                    changeDraft('contentJson', contentJson)
                  }
                />
              </div>
            </>
          ) : (
            <div className={styles.editorEmpty}>
              Select a note or create a new one.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
