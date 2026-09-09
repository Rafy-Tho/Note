import { useEffect, useState } from 'react';
import { Alert } from '../../../components/Alert/Alert.jsx';
import { Brand } from '../../../components/Brand/Brand.jsx';
import { authApi } from '../../auth/api/authApi.js';
import { notesApi } from '../../notes/api/notesApi.js';
import { documentFromText, documentText } from '../../notes/noteDocument.js';
import styles from './Workspace.module.css';

const EMPTY_DOCUMENT = { type: 'doc', content: [] };

export function Workspace({ session, onSignOut }) {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState('loading');
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

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
    setDraft(selected);
    setSaveStatus('Saved');
  }, [selected]);

  async function createNote() {
    if (
      saveStatus === 'Unsaved Changes' &&
      !window.confirm('You have unsaved changes. Create a new note anyway?')
    )
      return;
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
    if (
      saveStatus === 'Unsaved Changes' &&
      !window.confirm('You have unsaved changes. Switch notes anyway?')
    )
      return;
    setSelected(note);
  }

  function changeDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveStatus('Unsaved Changes');
  }

  async function saveNote() {
    if (!draft || saveStatus === 'Saved') return;
    setSaveStatus('Saving');
    setError(null);
    try {
      const updated = await notesApi.update(draft.id, {
        title: draft.title,
        contentJson: draft.contentJson,
        revision: draft.revision,
      });
      setNotes((current) =>
        current.map((note) => (note.id === updated.id ? updated : note)),
      );
      setSelected(updated);
      setSaveStatus('Saved');
    } catch (requestError) {
      setError(requestError.message);
      setSaveStatus('Save Failed');
    }
  }

  async function signOut() {
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
              <h1 id="workspace-title">Notes</h1>
            </div>
            <button
              className={styles.primaryButton}
              onClick={createNote}
              disabled={busy}
            >
              + New note
            </button>
          </div>
          {error && <Alert>{error}</Alert>}
          {notes.length === 0 ? (
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
                  onClick={saveNote}
                  disabled={saveStatus === 'Saved'}
                >
                  Save
                </button>
              </div>
              <input
                className={styles.titleInput}
                aria-label="Note title"
                value={draft.title}
                onChange={(event) => changeDraft('title', event.target.value)}
                placeholder="Untitled note"
              />
              <textarea
                className={styles.contentInput}
                aria-label="Note content"
                value={documentText(draft.contentJson)}
                onChange={(event) =>
                  changeDraft(
                    'contentJson',
                    documentFromText(event.target.value),
                  )
                }
                placeholder="Start writing..."
              />
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
