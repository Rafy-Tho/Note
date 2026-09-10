import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { Dialog } from '../../../components/common/Dialog/Dialog.jsx';
import { useToast } from '../../../components/common/Toast/Toast.jsx';
import { documentText } from '../../notes/noteDocument.js';
import { useNoteMutations } from '../hooks/useNoteMutations.js';
import {
  flattenNotesPages,
  useWorkspaceArchiveQuery,
  useWorkspaceFavoritesQuery,
  useWorkspaceNotesQuery,
  useWorkspaceTagNotesQuery,
  useWorkspaceTagsQuery,
  workspaceQueryKeys,
} from '../hooks/useWorkspaceQueries.js';
import { WorkspaceSearch } from './WorkspaceSearch.jsx';
import { WorkspaceTrash } from './WorkspaceTrash.jsx';

const titles = {
  notes: 'Notes',
  favorites: 'Favorites',
  archive: 'Archive',
  tags: 'Tags',
  search: 'Search',
  trash: 'Trash',
};

function EmptyState({ styles, title, children }) {
  return (
    <div className={styles.empty}>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

function notePreview(note) {
  return (
    note.preview ??
    (note.contentJson ? documentText(note.contentJson).slice(0, 240) : '')
  );
}

const NoteList = memo(function NoteList({
  styles,
  notes,
  label,
  selectedId,
  onSelect,
  onOpen,
  hasNextPage = false,
  isFetchingNextPage = false,
  loadMoreError = null,
  onEndReached,
  onRetryLoadMore,
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (
      !onEndReached ||
      !sentinelRef.current ||
      typeof window.IntersectionObserver === 'undefined'
    )
      return undefined;
    const root = sentinelRef.current.closest('[data-collection-scroll]');
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage)
          onEndReached();
      },
      { root, rootMargin: '240px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onEndReached]);

  return (
    <>
      <div className={styles.noteList} aria-label={label}>
        {notes.map((note) => (
          <button
            className={`${styles.noteRow} ${selectedId === note.id ? styles.selected : ''}`}
            key={note.id}
            type="button"
            onClick={() => (onSelect ? onSelect(note) : onOpen(note))}
          >
            <strong>{note.title || 'Untitled note'}</strong>
            <span>{notePreview(note) || 'Blank note'}</span>
          </button>
        ))}
      </div>
      {onEndReached && (hasNextPage || isFetchingNextPage || loadMoreError) && (
        <div className={styles.loadMore} ref={sentinelRef} aria-live="polite">
          {loadMoreError && (
            <>
              <span>Could not load more notes.</span>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={onRetryLoadMore}
                disabled={isFetchingNextPage}
              >
                Retry
              </button>
            </>
          )}
          {!loadMoreError && isFetchingNextPage && (
            <span>Loading more notes...</span>
          )}
          {!loadMoreError && !isFetchingNextPage && hasNextPage && (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={onEndReached}
            >
              Load more notes
            </button>
          )}
        </div>
      )}
    </>
  );
});

export const WorkspaceCollection = memo(function WorkspaceCollection({
  styles,
  view,
  mobilePane,
  selectedId,
  selectedTagId,
  getEditorState,
  allowNextNavigation,
  onSelectNote,
  onOpenNote,
  onTagChange,
  onSearchOpen,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notesQuery = useWorkspaceNotesQuery();
  const tagsQuery = useWorkspaceTagsQuery();
  const favoritesQuery = useWorkspaceFavoritesQuery(view === 'favorites');
  const archiveQuery = useWorkspaceArchiveQuery(view === 'archive');
  const tagNotesQuery = useWorkspaceTagNotesQuery(
    selectedTagId,
    view === 'tags',
  );
  const { createNote } = useNoteMutations();
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const { notify } = useToast();
  const notes = flattenNotesPages(notesQuery.data);
  const availableTags = tagsQuery.data ?? [];
  const collectionNotes =
    view === 'favorites'
      ? (favoritesQuery.data ?? [])
      : view === 'archive'
        ? (archiveQuery.data ?? [])
        : (tagNotesQuery.data ?? []);
  const collectionQuery =
    view === 'favorites'
      ? favoritesQuery
      : view === 'archive'
        ? archiveQuery
        : tagNotesQuery;
  const isInitialLoading = notesQuery.isLoading || tagsQuery.isLoading;
  const initialError =
    (notesQuery.isLoadingError && notesQuery.error) || tagsQuery.error;
  const busy = creating;
  const notesLoadMoreError = notesQuery.isFetchNextPageError
    ? notesQuery.error
    : null;

  const loadMoreNotes = useCallback(() => {
    if (!notesQuery.hasNextPage || notesQuery.isFetchingNextPage) return;
    void notesQuery.fetchNextPage().catch((requestError) => {
      setError(requestError.message);
    });
  }, [
    notesQuery.fetchNextPage,
    notesQuery.hasNextPage,
    notesQuery.isFetchingNextPage,
  ]);

  async function create() {
    const { isDirty, isSaving } = getEditorState();
    if (isSaving) return;
    if (isDirty) {
      setCreateConfirmOpen(true);
      return;
    }
    await createNoteNow();
  }

  async function createNoteNow() {
    setCreating(true);
    setError(null);
    try {
      const note = await createNote.mutateAsync({
        title: '',
        contentJson: { type: 'doc', content: [] },
      });
      queryClient.setQueryData(workspaceQueryKeys.note(note.id), note);
      notify('New note created.');
      allowNextNavigation();
      navigate(`/workspace/notes/${note.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreating(false);
    }
  }

  async function retryInitialLoad() {
    setError(null);
    await Promise.all([notesQuery.refetch(), tagsQuery.refetch()]).catch(
      (requestError) => setError(requestError.message),
    );
  }

  return (
    <section
      className={`${styles.collection} ${mobilePane === 'editor' ? styles.mobileHidden : ''}`}
      aria-labelledby="workspace-title"
      data-collection-scroll="true"
    >
      <div className={styles.collectionHeader}>
        <div>
          <p className={styles.eyebrow}>Private notes</p>
          <h1 id="workspace-title">{titles[view]}</h1>
        </div>
        {view === 'notes' && (
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => void create()}
          disabled={creating}
          >
            <Plus className="icon" size={16} aria-hidden="true" />
            <span>New note</span>
          </button>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      {initialError && (
        <>
          <Alert>{initialError.message}</Alert>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => void retryInitialLoad()}
          >
            <RotateCcw className="icon" size={15} aria-hidden="true" />
            <span>Retry loading workspace</span>
          </button>
        </>
      )}
      {isInitialLoading ? (
        <div className={styles.empty} aria-live="polite">
          Loading your notes...
        </div>
      ) : view === 'search' ? (
        <WorkspaceSearch styles={styles} onOpenResult={onSearchOpen} />
      ) : view === 'trash' ? (
        <WorkspaceTrash styles={styles} />
      ) : ['favorites', 'archive', 'tags'].includes(view) ? (
        collectionQuery.isLoading ? (
          <div className={styles.empty} aria-live="polite">
            Loading {view}...
          </div>
        ) : view === 'tags' && !selectedTagId ? (
          <div className={styles.tagBrowse}>
            <label htmlFor="browse-tag">Browse notes by tag</label>
            <select
              id="browse-tag"
              value={selectedTagId}
              onChange={(event) => onTagChange(event.target.value)}
            >
              <option value="">Choose a tag</option>
              {availableTags.map((tag) => (
                <option value={tag.id} key={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        ) : collectionNotes.length === 0 ? (
          <EmptyState styles={styles} title="No notes here.">
            Notes matching this view will appear here.
          </EmptyState>
        ) : (
          <NoteList
            styles={styles}
            notes={collectionNotes}
            label={`${view} notes`}
            onOpen={onOpenNote}
          />
        )
      ) : notesQuery.isLoading && notes.length === 0 ? (
        <div className={styles.empty} aria-live="polite">
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <EmptyState styles={styles} title="Your workspace is clear.">
          Create a note to begin capturing your thoughts.
        </EmptyState>
      ) : (
        <NoteList
          styles={styles}
          notes={notes}
          label="Your notes"
          selectedId={selectedId}
          onSelect={onSelectNote}
          hasNextPage={notesQuery.hasNextPage}
          isFetchingNextPage={notesQuery.isFetchingNextPage}
          loadMoreError={notesLoadMoreError}
          onEndReached={loadMoreNotes}
          onRetryLoadMore={loadMoreNotes}
        />
      )}
      {createConfirmOpen && (
        <Dialog
          title="Create a new note?"
          description="You have unsaved changes. Creating a new note will leave the current draft behind."
          onClose={() => setCreateConfirmOpen(false)}
          actions={
            <>
              <button className={styles.secondaryButton} type="button" onClick={() => setCreateConfirmOpen(false)}>
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  setCreateConfirmOpen(false);
                  void createNoteNow();
                }}
              >
                Create note
              </button>
            </>
          }
        />
      )}
    </section>
  );
});
