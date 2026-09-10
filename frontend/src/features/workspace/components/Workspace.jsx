import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../auth/api/authApi.js';
import { notesApi } from '../../notes/api/notesApi.js';
import { useWorkspaceMutations } from '../hooks/useWorkspaceMutations.js';
import { workspaceQueryKeys, useWorkspaceQueries } from '../hooks/useWorkspaceQueries.js';
import { useAutosave } from '../hooks/useAutosave.js';
import { WorkspaceCollection } from './WorkspaceCollection.jsx';
import { WorkspaceEditor } from './WorkspaceEditor.jsx';
import { WorkspaceHeader } from './WorkspaceHeader.jsx';
import { WorkspaceSidebar } from './WorkspaceSidebar.jsx';
import styles from './Workspace.module.css';

const EMPTY_DOCUMENT = { type: 'doc', content: [] };

export function Workspace({ session, onSignOut }) {
  const [view, setView] = useState('notes');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPage, setSearchPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState('collection');
  const closeMenuRef = useRef(null);
  const queryClient = useQueryClient();
  const queries = useWorkspaceQueries({ view, selectedTagId, searchQuery, searchPage });
  const mutations = useWorkspaceMutations();
  const saveNote = useCallback(
    (snapshot) =>
      mutations.updateNote.mutateAsync({
        noteId: snapshot.id,
        note: {
          title: snapshot.title,
          contentJson: snapshot.contentJson,
          revision: snapshot.revision,
        },
      }),
    [mutations.updateNote],
  );
  const autosave = useAutosave({
    note: selected,
    saveNote,
    onError: (requestError) => setError(requestError.message),
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

  const notes = queries.notes.data ?? [];
  const notebooks = queries.notebooks.data ?? [];
  const availableTags = queries.tags.data ?? [];
  const identities = queries.identities.data ?? [];
  const trashNotes = queries.trash.data ?? [];
  const searchData = queries.search.data ?? { data: [], pagination: { total: 0 } };
  const isBusy = busy || isSaving;

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    closeMenuRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (queries.notes.isSuccess && selected === null) setSelected(notes[0] ?? null);
  }, [notes, queries.notes.isSuccess, selected]);

  function changeDraft(field, value) {
    updateDraft(field, value);
    setError(null);
  }

  function updateTags(tags) {
    replaceDraft({ ...draft, tags });
  }

  function canLeaveDraft() {
    return !isDirty || window.confirm('You have unsaved changes. Leave this note without saving?');
  }

  async function createNote() {
    if (isDirty && !window.confirm('You have unsaved changes. Create a new note anyway?')) return;
    setBusy(true);
    setError(null);
    try {
      const note = await mutations.createNote.mutateAsync({ title: '', contentJson: EMPTY_DOCUMENT });
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
    if (isSaving || !canLeaveDraft()) return;
    setSelected(note);
    setMobilePane('editor');
  }

  function switchView(nextView) {
    if (nextView === view) {
      setMobileMenuOpen(false);
      return;
    }
    if (isSaving || !canLeaveDraft()) return;
    setView(nextView);
    setSelected(nextView === 'notes' ? notes[0] ?? null : null);
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
    setSearchPage(page);
    setError(null);
    try {
      await queries.searchNotes(query, page);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function openSearchResult(result) {
    if (isSaving || !canLeaveDraft()) return;
    setBusy(true);
    try {
      const note = await queryClient.fetchQuery({
        queryKey: workspaceQueryKeys.note(result.id),
        queryFn: () => notesApi.get(result.id),
      });
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
    if (!draft || isSaving || !window.confirm('Move this note to Trash?')) return;
    setBusy(true);
    try {
      await mutations.trashNote.mutateAsync(draft.id);
      setSelected(notes.find((note) => note.id !== draft.id) ?? null);
      setMobilePane('collection');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function restoreNote(note) {
    setBusy(true);
    try {
      const restored = await mutations.restoreNote.mutateAsync(note.id);
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
    try {
      const updated = await mutations.favoriteNote.mutateAsync({ noteId: note.id, favorite: isFavorite });
      setSelected((current) => (current?.id === updated.id ? updated : current));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeArchive(note) {
    setBusy(true);
    try {
      const updated = await mutations.archiveNote.mutateAsync({ noteId: note.id, archived: note.state === 'archived' });
      setSelected(updated.state === 'active' ? updated : null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function assignNotebook(notebookId) {
    if (!draft) return;
    try {
      const updated = await mutations.assignNotebook.mutateAsync({ noteId: draft.id, notebookId: notebookId || null });
      replaceDraft(updated);
      setSelected(updated);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function createNotebook(event) {
    event.preventDefault();
    try {
      await mutations.createNotebook.mutateAsync(event.currentTarget.elements.notebookName.value);
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function renameNotebook(notebook) {
    const name = window.prompt('Rename notebook', notebook.name);
    if (!name || name === notebook.name) return;
    try {
      await mutations.renameNotebook.mutateAsync({ notebookId: notebook.id, name });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteNotebook(notebook) {
    if (!window.confirm(`Delete notebook "${notebook.name}"? Notes will be unassigned.`)) return;
    try {
      await mutations.deleteNotebook.mutateAsync(notebook.id);
      if (draft?.notebookId === notebook.id) await assignNotebook('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function permanentlyDelete(note) {
    if (!window.confirm('Permanently delete this note? This cannot be undone.')) return;
    try {
      await mutations.permanentlyDelete.mutateAsync(note.id);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function reloadServerCopy() {
    if (!draft) return;
    try {
      const serverNote = await queryClient.fetchQuery({
        queryKey: workspaceQueryKeys.note(draft.id),
        queryFn: () => notesApi.get(draft.id),
      });
      setSelected(serverNote);
      setError(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function signOut() {
    if (!canLeaveDraft()) return;
    setBusy(true);
    try {
      await authApi.logout();
      onSignOut();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function unlinkProvider(provider) {
    if (!window.confirm(`Unlink ${provider} from this account?`)) return;
    setBusy(true);
    try {
      await mutations.unlinkProvider.mutateAsync(provider);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function linkProvider(provider) {
    setBusy(true);
    try {
      await authApi.startProviderLink(provider);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  if (queries.isInitialLoading) {
    return <main className={styles.loading} aria-live="polite">Loading your notes...</main>;
  }

  const initialError = queries.initialError?.message ?? error;
  const collectionNotes = view === 'favorites' ? queries.favorites.data ?? [] : view === 'archive' ? queries.archive.data ?? [] : queries.tagNotes.data ?? [];
  const collectionLoading = view === 'favorites' ? queries.favorites.isLoading : view === 'archive' ? queries.archive.isLoading : queries.tagNotes.isLoading;

  return (
    <main className={styles.workspace} aria-labelledby="workspace-title">
      <WorkspaceHeader email={session.user.email} menuOpen={mobileMenuOpen} onOpenMenu={() => setMobileMenuOpen(true)} styles={styles} />
      <div className={styles.layout}>
        {mobileMenuOpen && <button className={styles.drawerBackdrop} type="button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
        <WorkspaceSidebar
          styles={styles}
          open={mobileMenuOpen}
          closeMenuRef={closeMenuRef}
          view={view}
          identities={identities}
          identityLoading={queries.identities.isLoading}
          busy={isBusy}
          onClose={() => setMobileMenuOpen(false)}
          onSwitchView={switchView}
          onLinkProvider={linkProvider}
          onUnlinkProvider={unlinkProvider}
          onSignOut={signOut}
        />
        <WorkspaceCollection
          styles={styles}
          view={view}
          mobilePane={mobilePane}
          notes={notes}
          selectedId={selected?.id}
          availableTags={availableTags}
          selectedTagId={selectedTagId}
          collectionNotes={collectionNotes}
          collectionLoading={collectionLoading}
          trashNotes={trashNotes}
          trashLoading={queries.trash.isLoading}
          search={{ query: searchQuery, results: searchData.data ?? [], status: queries.search.isFetching ? 'loading' : 'ready', page: searchPage, total: searchData.pagination?.total ?? 0, onQueryChange: setSearchQuery, onSubmit: submitSearch }}
          error={initialError}
          initialLoadFailed={Boolean(queries.initialError)}
          busy={isBusy}
          onCreateNote={createNote}
          onRetry={queries.refetchInitial}
          onSelectNote={selectNote}
          onOpenNote={openSearchResult}
          onRestore={restoreNote}
          onPermanentDelete={permanentlyDelete}
          onTagChange={setSelectedTagId}
          onSearchOpen={openSearchResult}
        />
        <WorkspaceEditor
          styles={styles}
          mobilePane={mobilePane}
          view={view}
          draft={draft}
          notebooks={notebooks}
          saveStatus={saveStatus}
          conflict={conflict}
          busy={isBusy}
          onBack={() => setMobilePane('collection')}
          onSave={() => void saveDraft()}
          onReload={reloadServerCopy}
          onTrash={trashCurrentNote}
          onFavorite={(isFavorite) => void setNoteFavorite(draft, isFavorite)}
          onArchive={changeArchive}
          onDraftChange={changeDraft}
          onTagsChange={updateTags}
          onAssignNotebook={(notebookId) => void assignNotebook(notebookId)}
          onCreateNotebook={createNotebook}
          onRenameNotebook={renameNotebook}
          onDeleteNotebook={deleteNotebook}
        />
      </div>
    </main>
  );
}
