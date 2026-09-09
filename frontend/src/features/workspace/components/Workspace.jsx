import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from '../../../components/Alert/Alert.jsx';
import { Brand } from '../../../components/Brand/Brand.jsx';
import { authApi } from '../../auth/api/authApi.js';
import { notesApi } from '../../notes/api/notesApi.js';
import { documentText } from '../../notes/noteDocument.js';
import { TagControls } from '../../tags/components/TagControls.jsx';
import { searchApi } from '../../search/api/searchApi.js';
import { tagsApi } from '../../tags/api/tagsApi.js';
import { notebooksApi } from '../../notebooks/api/notebooksApi.js';
import { NoteEditor } from './NoteEditor.jsx';
import styles from './Workspace.module.css';

const EMPTY_DOCUMENT = { type: 'doc', content: [] };

function draftSignature(note) {
  return JSON.stringify({ title: note.title, contentJson: note.contentJson });
}

export function Workspace({ session, onSignOut }) {
  const [notes, setNotes] = useState([]);
  const [trashNotes, setTrashNotes] = useState([]);
  const [favoriteNotes, setFavoriteNotes] = useState([]);
  const [archiveNotes, setArchiveNotes] = useState([]);
  const [tagNotes, setTagNotes] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [collectionStatus, setCollectionStatus] = useState('ready');
  const [view, setView] = useState('notes');
  const [trashStatus, setTrashStatus] = useState('ready');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState('ready');
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState('loading');
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [error, setError] = useState(null);
  const [initialLoadFailed, setInitialLoadFailed] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState('collection');
  const latestDraftRef = useRef(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const saveTimerRef = useRef(null);
  const closeMenuRef = useRef(null);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    closeMenuRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const loadWorkspace = useCallback(() => {
    setStatus('loading');
    setInitialLoadFailed(false);
    Promise.all([notesApi.list(), notebooksApi.list(), tagsApi.list()])
      .then(([noteData, notebookData, tagData]) => {
        setNotes(noteData);
        setNotebooks(notebookData);
        setAvailableTags(tagData);
        setSelected(noteData[0] ?? null);
        setStatus('ready');
        setError(null);
      })
      .catch((requestError) => {
        setError(requestError.message);
        setInitialLoadFailed(true);
        setStatus('ready');
      });
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

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
    if (view === 'notes' || view === 'trash' || view === 'search') return;
    setCollectionStatus('loading');
    const request =
      view === 'favorites'
        ? notesApi.listFavorites()
        : view === 'archive'
          ? notesApi.list({ state: 'archived' })
          : selectedTagId
            ? tagsApi.listNotes(selectedTagId)
            : Promise.resolve([]);
    request
      .then((data) => {
        if (view === 'favorites') setFavoriteNotes(data);
        if (view === 'archive') setArchiveNotes(data);
        if (view === 'tags') setTagNotes(data);
        setCollectionStatus('ready');
      })
      .catch((requestError) => {
        setError(requestError.message);
        setCollectionStatus('ready');
      });
  }, [view, selectedTagId]);

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

  function canLeaveDraft() {
    if (!dirtyRef.current) return true;
    return window.confirm(
      'You have unsaved changes. Leave this note without saving?',
    );
  }

  function updateTags(tags) {
    const nextDraft = { ...latestDraftRef.current, tags };
    latestDraftRef.current = nextDraft;
    setDraft(nextDraft);
    setNotes((current) =>
      current.map((note) =>
        note.id === nextDraft.id ? { ...note, tags } : note,
      ),
    );
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
      setMobilePane('editor');
      setMobileMenuOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function selectNote(note) {
    if (savingRef.current) return;
    if (!canLeaveDraft()) return;
    setSelected(note);
    setMobilePane('editor');
  }

  function switchView(nextView) {
    if (nextView === view) {
      setMobileMenuOpen(false);
      return;
    }
    if (savingRef.current) return;
    if (!canLeaveDraft()) return;
    setView(nextView);
    setSelected(nextView === 'notes' ? (notes[0] ?? null) : null);
    setMobilePane('collection');
    setMobileMenuOpen(false);
  }

  async function submitSearch(event, page = 1) {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setError('Enter search text.');
      return;
    }
    setSearchStatus('loading');
    setError(null);
    try {
      const result = await searchApi.search(query, page);
      setSearchResults(result.data);
      setSearchTotal(result.pagination.total);
      setSearchPage(page);
      setSearchStatus('ready');
    } catch (requestError) {
      setError(requestError.message);
      setSearchStatus('ready');
    }
  }

  async function openSearchResult(result) {
    if (savingRef.current || !canLeaveDraft()) return;
    setBusy(true);
    setError(null);
    try {
      const note = await notesApi.get(result.id);
      setNotes((current) =>
        current.some((item) => item.id === note.id)
          ? current.map((item) => (item.id === note.id ? note : item))
          : [note, ...current],
      );
      setView('notes');
      setSelected(note);
      setMobilePane('editor');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
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
      setMobilePane('collection');
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
      setMobilePane('editor');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function setNoteFavorite(note, isFavorite) {
    setBusy(true);
    setError(null);
    try {
      const updated = isFavorite
        ? await notesApi.favorite(note.id)
        : await notesApi.unfavorite(note.id);
      setNotes((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      latestDraftRef.current = updated;
      setDraft((current) => (current?.id === updated.id ? updated : current));
      setSelected((current) =>
        current?.id === updated.id ? updated : current,
      );
      setFavoriteNotes((current) =>
        isFavorite
          ? [updated, ...current.filter((item) => item.id !== updated.id)]
          : current.filter((item) => item.id !== updated.id),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeArchive(note) {
    setBusy(true);
    setError(null);
    try {
      const updated =
        note.state === 'archived'
          ? await notesApi.unarchive(note.id)
          : await notesApi.archive(note.id);
      setNotes((current) =>
        updated.state === 'active'
          ? [updated, ...current.filter((item) => item.id !== updated.id)]
          : current.filter((item) => item.id !== updated.id),
      );
      setArchiveNotes((current) =>
        updated.state === 'archived'
          ? [updated, ...current.filter((item) => item.id !== updated.id)]
          : current.filter((item) => item.id !== updated.id),
      );
      latestDraftRef.current = updated;
      setSelected(updated.state === 'active' ? updated : null);
      setDraft(updated.state === 'active' ? updated : null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function assignNotebook(notebookId) {
    if (!draft) return;
    setBusy(true);
    try {
      const updated = await notesApi.assignNotebook(
        draft.id,
        notebookId || null,
      );
      latestDraftRef.current = updated;
      setDraft(updated);
      setSelected(updated);
      setNotes((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function createNotebook(event) {
    event.preventDefault();
    const name = event.currentTarget.elements.notebookName.value;
    try {
      const notebook = await notebooksApi.create(name);
      setNotebooks((current) => [...current, notebook]);
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function renameNotebook(notebook) {
    const name = window.prompt('Rename notebook', notebook.name);
    if (!name || name === notebook.name) return;
    try {
      const updated = await notebooksApi.rename(notebook.id, name);
      setNotebooks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteNotebook(notebook) {
    if (
      !window.confirm(
        `Delete notebook "${notebook.name}"? Notes will be unassigned.`,
      )
    )
      return;
    try {
      await notebooksApi.remove(notebook.id);
      setNotebooks((current) =>
        current.filter((item) => item.id !== notebook.id),
      );
      if (draft?.notebookId === notebook.id) await assignNotebook('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function permanentlyDelete(note) {
    if (!window.confirm('Permanently delete this note? This cannot be undone.'))
      return;
    setBusy(true);
    try {
      await notesApi.permanentlyDelete(note.id);
      setTrashNotes((current) => current.filter((item) => item.id !== note.id));
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
    if (!canLeaveDraft()) return;
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
        <div className={styles.topbarBrand}>
          <button
            className={styles.menuButton}
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            Menu
          </button>
          <Brand />
        </div>
        <div className={styles.topbarActions}>
          <span className={styles.email}>{session.user.email}</span>
        </div>
      </header>
      <div className={styles.layout}>
        {mobileMenuOpen && (
          <button
            className={styles.drawerBackdrop}
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <aside
          className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}
          aria-label="Workspace navigation"
        >
          <div className={styles.sidebarHeader}>
            <span className={styles.eyebrow}>Workspace</span>
            <button
              className={styles.closeMenuButton}
              type="button"
              ref={closeMenuRef}
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
            >
              Close
            </button>
          </div>
          <nav className={styles.nav}>
            {[
              ['notes', 'Notes'],
              ['favorites', 'Favorites'],
              ['archive', 'Archive'],
              ['tags', 'Tags'],
              ['search', 'Search'],
              ['trash', 'Trash'],
            ].map(([navView, label]) => (
              <button
                className={styles.navButton}
                type="button"
                key={navView}
                aria-current={view === navView ? 'page' : undefined}
                onClick={() => switchView(navView)}
              >
                <span>{label}</span>
                {view === navView && <span aria-hidden="true">/</span>}
              </button>
            ))}
          </nav>
          <button
            className={styles.signOutButton}
            type="button"
            onClick={signOut}
            disabled={busy}
          >
            {busy ? 'Signing out...' : 'Sign out'}
          </button>
        </aside>
        <section
          className={`${styles.collection} ${mobilePane === 'editor' ? styles.mobileHidden : ''}`}
          aria-labelledby="workspace-title"
        >
          <div className={styles.collectionHeader}>
            <div>
              <p className={styles.eyebrow}>Private notes</p>
              <h1 id="workspace-title">
                {view === 'trash'
                  ? 'Trash'
                  : view === 'favorites'
                    ? 'Favorites'
                    : view === 'archive'
                      ? 'Archive'
                      : view === 'tags'
                        ? 'Tags'
                        : view === 'search'
                          ? 'Search'
                          : 'Notes'}
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
          {initialLoadFailed && (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={loadWorkspace}
            >
              Retry loading workspace
            </button>
          )}
          {view === 'search' ? (
            <>
              <form className={styles.searchForm} onSubmit={submitSearch}>
                <input
                  aria-label="Search notes"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search title, content, or tags"
                />
                <button className={styles.primaryButton} type="submit">
                  Search
                </button>
              </form>
              {searchStatus === 'loading' ? (
                <div className={styles.empty} aria-live="polite">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className={styles.empty}>
                  <h2>
                    {searchQuery ? 'No notes found.' : 'Search your notes.'}
                  </h2>
                  <p>
                    Search active and archived notes by title, content, or tag.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className={styles.searchResults}
                    aria-label="Search results"
                  >
                    {searchResults.map((result) => (
                      <button
                        className={styles.searchResult}
                        key={result.id}
                        onClick={() => openSearchResult(result)}
                      >
                        <strong>{result.title || 'Untitled note'}</strong>
                        <span>
                          {result.state} ·{' '}
                          {result.tags.map((tag) => tag.name).join(', ') ||
                            'No tags'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.pagination}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => submitSearch(null, searchPage - 1)}
                      disabled={searchPage === 1}
                    >
                      Previous
                    </button>
                    <span>Page {searchPage}</span>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => submitSearch(null, searchPage + 1)}
                      disabled={searchPage * 20 >= searchTotal}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </>
          ) : view === 'trash' && trashStatus === 'loading' ? (
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
                  <button
                    className={styles.dangerButton}
                    onClick={() => permanentlyDelete(note)}
                    disabled={busy}
                  >
                    Delete permanently
                  </button>
                </div>
              ))}
            </div>
          ) : ['favorites', 'archive', 'tags'].includes(view) ? (
            collectionStatus === 'loading' ? (
              <div className={styles.empty} aria-live="polite">
                Loading {view}...
              </div>
            ) : view === 'tags' && !selectedTagId ? (
              <div className={styles.tagBrowse}>
                <label htmlFor="browse-tag">Browse notes by tag</label>
                <select
                  id="browse-tag"
                  value={selectedTagId}
                  onChange={(event) => setSelectedTagId(event.target.value)}
                >
                  <option value="">Choose a tag</option>
                  {availableTags.map((tag) => (
                    <option value={tag.id} key={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (view === 'favorites'
                ? favoriteNotes
                : view === 'archive'
                  ? archiveNotes
                  : tagNotes
              ).length === 0 ? (
              <div className={styles.empty}>
                <h2>No notes here.</h2>
                <p>Notes matching this view will appear here.</p>
              </div>
            ) : (
              <div className={styles.noteList} aria-label={`${view} notes`}>
                {(view === 'favorites'
                  ? favoriteNotes
                  : view === 'archive'
                    ? archiveNotes
                    : tagNotes
                ).map((note) => (
                  <button
                    className={styles.noteRow}
                    key={note.id}
                    onClick={() => openSearchResult(note)}
                  >
                    <strong>{note.title || 'Untitled note'}</strong>
                    <span>
                      {note.state} {note.isFavorite ? '· favorite' : ''}
                    </span>
                  </button>
                ))}
              </div>
            )
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
        <section
          className={`${styles.editor} ${mobilePane === 'collection' ? styles.mobileHidden : ''}`}
          aria-label="Note editor"
        >
          <button
            className={styles.backToCollection}
            type="button"
            onClick={() => setMobilePane('collection')}
          >
            Back to {view === 'notes' ? 'notes' : view}
          </button>
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
                <button
                  className={styles.secondaryButton}
                  onClick={() => void setNoteFavorite(draft, !draft.isFavorite)}
                  disabled={busy}
                >
                  {draft.isFavorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => void changeArchive(draft)}
                  disabled={busy}
                >
                  {draft.state === 'archived' ? 'Unarchive' : 'Archive'}
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
              <TagControls
                noteId={draft.id}
                tags={draft.tags ?? []}
                onTagsChange={updateTags}
                disabled={busy || saveStatus === 'Saving'}
              />
              <div className={styles.notebookControls}>
                <label htmlFor="note-notebook">Notebook</label>
                <select
                  id="note-notebook"
                  value={draft.notebookId ?? ''}
                  onChange={(event) => void assignNotebook(event.target.value)}
                  disabled={busy}
                >
                  <option value="">No notebook</option>
                  {notebooks.map((notebook) => (
                    <option value={notebook.id} key={notebook.id}>
                      {notebook.name}
                    </option>
                  ))}
                </select>
                <form onSubmit={createNotebook} className={styles.newTagForm}>
                  <input
                    name="notebookName"
                    aria-label="New notebook name"
                    placeholder="New notebook"
                  />
                  <button className={styles.secondaryButton} type="submit">
                    Create
                  </button>
                </form>
                {notebooks.map((notebook) => (
                  <span className={styles.notebookItem} key={notebook.id}>
                    {notebook.name}
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => void renameNotebook(notebook)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => void deleteNotebook(notebook)}
                    >
                      Delete
                    </button>
                  </span>
                ))}
              </div>
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
