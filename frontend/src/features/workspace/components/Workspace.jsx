import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { authApi } from '../../auth/services/authApi.js';
import { notesApi } from '../../notes/services/notesApi.js';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { useWorkspaceMutations } from '../hooks/useWorkspaceMutations.js';
import {
  flattenNotesPages,
  workspaceQueryKeys,
  useWorkspaceQueries,
} from '../hooks/useWorkspaceQueries.js';
import { useAutosave } from '../hooks/useAutosave.js';
import { collectionPath, notePath, viewFromPath } from '../routing.js';
import { WorkspaceCollection } from './WorkspaceCollection.jsx';
import { WorkspaceEditor } from './WorkspaceEditor.jsx';
import { WorkspaceHeader } from './WorkspaceHeader.jsx';
import { WorkspaceSidebar } from './WorkspaceSidebar.jsx';
import styles from './Workspace.module.css';

const EMPTY_DOCUMENT = { type: 'doc', content: [] };
const EMPTY_LIST = [];
const EMPTY_SEARCH = { data: [], pagination: { total: 0 } };

export function Workspace() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = viewFromPath(location.pathname);
  const selectedTagId = params.tagId ?? '';
  const searchQuery = searchParams.get('q') ?? '';
  const searchPage = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState(
    params.noteId ? 'editor' : 'collection',
  );
  const closeMenuRef = useRef(null);
  const allowBlockedNavigationRef = useRef(false);
  const queryClient = useQueryClient();
  const queries = useWorkspaceQueries({
    view,
    selectedTagId,
    searchQuery,
    searchPage,
    noteId: params.noteId,
  });
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
  const handleAutosaveError = useCallback(
    (requestError) => setError(requestError.message),
    [],
  );
  const editorNote =
    params.noteId && selected?.id === params.noteId ? selected : null;
  const autosave = useAutosave({
    note: editorNote,
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

  const notes = useMemo(
    () => flattenNotesPages(queries.notes.data),
    [queries.notes.data],
  );
  const notebooks = queries.notebooks.data ?? EMPTY_LIST;
  const availableTags = queries.tags.data ?? EMPTY_LIST;
  const identities = queries.identities.data ?? EMPTY_LIST;
  const trashNotes = queries.trash.data ?? EMPTY_LIST;
  const searchData = queries.search.data ?? EMPTY_SEARCH;
  const isBusy = busy || isSaving;
  const collectionNotes =
    view === 'favorites'
      ? (queries.favorites.data ?? EMPTY_LIST)
      : view === 'archive'
        ? (queries.archive.data ?? EMPTY_LIST)
        : (queries.tagNotes.data ?? EMPTY_LIST);
  const collectionLoading =
    view === 'favorites'
      ? queries.favorites.isLoading
      : view === 'archive'
        ? queries.archive.isLoading
        : queries.tagNotes.isLoading;
  const blocker = useBlocker(isDirty && !isSaving);

  const notesLoadMoreError = queries.notes.isFetchNextPageError
    ? queries.notes.error
    : null;

  const loadMoreNotes = useCallback(() => {
    if (!queries.notes.hasNextPage || queries.notes.isFetchingNextPage) return;
    void queries.notes.fetchNextPage().catch((requestError) => {
      setError(requestError.message);
    });
  }, [
    queries.notes.fetchNextPage,
    queries.notes.hasNextPage,
    queries.notes.isFetchingNextPage,
  ]);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (allowBlockedNavigationRef.current) {
      allowBlockedNavigationRef.current = false;
      blocker.proceed();
      return;
    }
    if (
      window.confirm(
        'You have unsaved changes. Leave this note without saving?',
      )
    )
      blocker.proceed();
    else blocker.reset();
  }, [blocker]);

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
    if (!params.noteId) {
      setSelected(null);
      return;
    }
    if (queries.note.data) {
      setSelected((current) => {
        if (current?.id === queries.note.data.id && isDirty) return current;
        return queries.note.data;
      });
      setError(null);
      return;
    }
    if (queries.note.error) {
      setSelected((current) =>
        current?.id === params.noteId && isDirty ? current : null,
      );
      setError(queries.note.error.message);
      return;
    }
    setSelected((current) =>
      current?.id === params.noteId ? current : null,
    );
  }, [isDirty, params.noteId, queries.note.data, queries.note.error]);

  useEffect(() => {
    setMobilePane(params.noteId ? 'editor' : 'collection');
  }, [params.noteId]);

  function changeDraft(field, value) {
    updateDraft(field, value);
    setError(null);
  }

  function updateTags(tags) {
    replaceDraft({ ...draft, tags });
  }

  const confirmNavigation = useCallback(
    () =>
      !isDirty ||
      window.confirm(
        'You have unsaved changes. Leave this note without saving?',
      ),
    [isDirty],
  );

  const allowNextNavigation = useCallback(() => {
    if (isDirty) allowBlockedNavigationRef.current = true;
  }, [isDirty]);

  const canLeaveDraft = confirmNavigation;

  async function createNote() {
    if (isSaving) return;
    if (
      isDirty &&
      !window.confirm('You have unsaved changes. Create a new note anyway?')
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const note = await mutations.createNote.mutateAsync({
        title: '',
        contentJson: EMPTY_DOCUMENT,
      });
      queryClient.setQueryData(workspaceQueryKeys.note(note.id), note);
      allowNextNavigation();
      navigate(`/workspace/notes/${note.id}`);
      setMobilePane('editor');
      setMobileMenuOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const selectNote = useCallback(
    (note) => {
      if (
        isSaving ||
        note.id === params.noteId ||
        !confirmNavigation()
      )
        return;
      allowNextNavigation();
      navigate(notePath(view, note.id, selectedTagId));
      setMobilePane('editor');
    },
    [
      allowNextNavigation,
      confirmNavigation,
      isSaving,
      navigate,
      params.noteId,
      selectedTagId,
      view,
    ],
  );

  const switchView = useCallback(
    (nextView) => {
      if (isSaving || view === nextView || !confirmNavigation()) return;
      allowNextNavigation();
      navigate(collectionPath(nextView));
      setMobilePane('collection');
      setMobileMenuOpen(false);
    },
    [allowNextNavigation, confirmNavigation, isSaving, navigate, view],
  );

  function updateSearchQuery(query) {
    const nextParams = new window.URLSearchParams(searchParams);
    if (query) nextParams.set('q', query);
    else nextParams.delete('q');
    nextParams.set('page', '1');
    setSearchParams(nextParams, { replace: true });
  }

  async function submitSearch(event, page = 1) {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setError('Enter search text.');
      return;
    }
    const nextParams = new window.URLSearchParams(searchParams);
    nextParams.set('page', String(page));
    setSearchParams(nextParams, { replace: true });
    setError(null);
    try {
      await queries.searchNotes(query, page);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const openSearchResult = useCallback(
    (result) => {
      if (isSaving || !confirmNavigation()) return;
      allowNextNavigation();
      const nextParams = new window.URLSearchParams(searchParams);
      navigate(`${notePath('search', result.id)}?${nextParams.toString()}`);
      setMobilePane('editor');
    },
    [allowNextNavigation, confirmNavigation, isSaving, navigate, searchParams],
  );

  const goBackToCollection = useCallback(() => {
    if (!confirmNavigation()) return;
    allowNextNavigation();
    navigate(collectionPath(view, selectedTagId));
  }, [allowNextNavigation, confirmNavigation, navigate, selectedTagId, view]);

  async function trashCurrentNote() {
    if (
      !draft ||
      isSaving ||
      !confirmNavigation() ||
      !window.confirm('Move this note to Trash?')
    )
      return;
    setBusy(true);
    try {
      await mutations.trashNote.mutateAsync(draft.id);
      allowNextNavigation();
      navigate('/workspace/notes');
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
      queryClient.setQueryData(
        workspaceQueryKeys.note(restored.id),
        restored,
      );
      navigate(
        restored.state === 'archived'
          ? `/workspace/archive/${restored.id}`
          : `/workspace/notes/${restored.id}`,
      );
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
      const updated = await mutations.favoriteNote.mutateAsync({
        noteId: note.id,
        favorite: isFavorite,
      });
      setSelected((current) =>
        current?.id === updated.id ? updated : current,
      );
      queryClient.setQueryData(workspaceQueryKeys.note(updated.id), updated);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeArchive(note) {
    setBusy(true);
    try {
      const updated = await mutations.archiveNote.mutateAsync({
        noteId: note.id,
        archived: note.state === 'archived',
      });
      navigate(
        updated.state === 'active'
          ? `/workspace/notes/${updated.id}`
          : `/workspace/archive/${updated.id}`,
      );
      queryClient.setQueryData(workspaceQueryKeys.note(updated.id), updated);
      setSelected(updated);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function assignNotebook(notebookId) {
    if (!draft) return;
    try {
      const updated = await mutations.assignNotebook.mutateAsync({
        noteId: draft.id,
        notebookId: notebookId || null,
      });
      replaceDraft(updated);
      setSelected(updated);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function createNotebook(event) {
    event.preventDefault();
    try {
      await mutations.createNotebook.mutateAsync(
        event.currentTarget.elements.notebookName.value,
      );
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function renameNotebook(notebook) {
    const name = window.prompt('Rename notebook', notebook.name);
    if (!name || name === notebook.name) return;
    try {
      await mutations.renameNotebook.mutateAsync({
        notebookId: notebook.id,
        name,
      });
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
      await mutations.deleteNotebook.mutateAsync(notebook.id);
      if (draft?.notebookId === notebook.id) await assignNotebook('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function permanentlyDelete(note) {
    if (!window.confirm('Permanently delete this note? This cannot be undone.'))
      return;
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
        queryFn: ({ signal }) => notesApi.get(draft.id, { signal }),
        staleTime: 0,
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
      await logout();
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
    return (
      <main className={styles.loading} aria-live="polite">
        Loading your notes...
      </main>
    );
  }

  const initialError = queries.initialError?.message ?? error;
  return (
    <main className={styles.workspace} aria-labelledby="workspace-title">
      <WorkspaceHeader
        email={session.user.email}
        menuOpen={mobileMenuOpen}
        onOpenMenu={() => setMobileMenuOpen(true)}
        styles={styles}
      />
      <div className={styles.layout}>
        {mobileMenuOpen && (
          <button
            className={styles.drawerBackdrop}
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
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
          notesLoading={queries.notes.isLoading}
          notesFetchingNextPage={queries.notes.isFetchingNextPage}
          notesHasNextPage={queries.notes.hasNextPage}
          notesLoadMoreError={notesLoadMoreError}
          onLoadMoreNotes={loadMoreNotes}
          selectedId={params.noteId}
          availableTags={availableTags}
          selectedTagId={selectedTagId}
          collectionNotes={collectionNotes}
          collectionLoading={collectionLoading}
          trashNotes={trashNotes}
          trashLoading={queries.trash.isLoading}
          search={{
            query: searchQuery,
            results: searchData.data ?? [],
            status: queries.search.isFetching ? 'loading' : 'ready',
            page: searchPage,
            total: searchData.pagination?.total ?? 0,
            onQueryChange: updateSearchQuery,
            onSubmit: submitSearch,
          }}
          error={initialError}
          initialLoadFailed={Boolean(queries.initialError)}
          busy={isBusy}
          onCreateNote={createNote}
          onRetry={queries.refetchInitial}
          onSelectNote={selectNote}
          onOpenNote={selectNote}
          onRestore={restoreNote}
          onPermanentDelete={permanentlyDelete}
          onTagChange={(tagId) => navigate(collectionPath('tags', tagId))}
          onSearchOpen={openSearchResult}
        />
        <WorkspaceEditor
          styles={styles}
          mobilePane={mobilePane}
          view={view}
          draft={draft}
          noteLoading={Boolean(params.noteId && queries.note.isLoading)}
          noteError={params.noteId ? queries.note.error : null}
          notebooks={notebooks}
          availableTags={availableTags}
          tagsLoading={queries.tags.isLoading}
          saveStatus={saveStatus}
          conflict={conflict}
          busy={isBusy}
          onBack={goBackToCollection}
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
