import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { documentText } from '../../notes/noteDocument.js';

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

function NoteList({ styles, notes, label, selectedId, onSelect, onOpen }) {
  return (
    <div className={styles.noteList} aria-label={label}>
      {notes.map((note) => (
        <button
          className={`${styles.noteRow} ${selectedId === note.id ? styles.selected : ''}`}
          key={note.id}
          onClick={() => (onSelect ? onSelect(note) : onOpen(note))}
        >
          <strong>{note.title || 'Untitled note'}</strong>
          <span>
            {documentText(note.contentJson).slice(0, 72) || 'Blank note'}
          </span>
        </button>
      ))}
    </div>
  );
}

function SearchPanel({ styles, query, results, status, page, total, onQueryChange, onSubmit, onOpen }) {
  return (
    <>
      <form className={styles.searchForm} onSubmit={onSubmit}>
        <input
          aria-label="Search notes"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search title, content, or tags"
        />
        <button className={styles.primaryButton} type="submit">
          <Search className="icon" size={15} aria-hidden="true" />
          <span>Search</span>
        </button>
      </form>
      {status === 'loading' ? (
        <div className={styles.empty} aria-live="polite">Searching...</div>
      ) : results.length === 0 ? (
        <EmptyState styles={styles} title={query ? 'No notes found.' : 'Search your notes.'}>
          Search active and archived notes by title, content, or tag.
        </EmptyState>
      ) : (
        <>
          <div className={styles.searchResults} aria-label="Search results">
            {results.map((result) => (
              <button className={styles.searchResult} key={result.id} onClick={() => onOpen(result)}>
                <strong>{result.title || 'Untitled note'}</strong>
                <span>
                  {result.state} · {result.tags.map((tag) => tag.name).join(', ') || 'No tags'}
                </span>
              </button>
            ))}
          </div>
          <div className={styles.pagination}>
            <button className={styles.secondaryButton} onClick={() => onSubmit(null, page - 1)} disabled={page === 1}>
              <ChevronLeft className="icon" size={15} aria-hidden="true" />
              <span>Previous</span>
            </button>
            <span>Page {page}</span>
            <button className={styles.secondaryButton} onClick={() => onSubmit(null, page + 1)} disabled={page * 20 >= total}>
              <span>Next</span>
              <ChevronRight className="icon" size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </>
  );
}

export function WorkspaceCollection({
  styles,
  view,
  mobilePane,
  notes,
  selectedId,
  availableTags,
  selectedTagId,
  collectionNotes,
  collectionLoading,
  trashNotes,
  trashLoading,
  search,
  error,
  initialLoadFailed,
  busy,
  onCreateNote,
  onRetry,
  onSelectNote,
  onOpenNote,
  onRestore,
  onPermanentDelete,
  onTagChange,
  onSearchOpen,
}) {
  return (
    <section className={`${styles.collection} ${mobilePane === 'editor' ? styles.mobileHidden : ''}`} aria-labelledby="workspace-title">
      <div className={styles.collectionHeader}>
        <div>
          <p className={styles.eyebrow}>Private notes</p>
          <h1 id="workspace-title">{titles[view]}</h1>
        </div>
        {view === 'notes' && (
          <button className={styles.primaryButton} onClick={onCreateNote} disabled={busy}>
            <Plus className="icon" size={16} aria-hidden="true" />
            <span>New note</span>
          </button>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      {initialLoadFailed && (
        <button className={styles.secondaryButton} type="button" onClick={onRetry}>
          <RotateCcw className="icon" size={15} aria-hidden="true" />
          <span>Retry loading workspace</span>
        </button>
      )}
      {view === 'search' ? (
        <SearchPanel styles={styles} {...search} onOpen={onSearchOpen} />
      ) : view === 'trash' && trashLoading ? (
        <div className={styles.empty} aria-live="polite">Loading Trash...</div>
      ) : view === 'trash' && trashNotes.length === 0 ? (
        <EmptyState styles={styles} title="Trash is empty.">Notes moved here can be restored later.</EmptyState>
      ) : view === 'trash' ? (
        <div className={styles.noteList} aria-label="Trashed notes">
          {trashNotes.map((note) => (
            <div className={styles.noteRow} key={note.id}>
              <strong>{note.title || 'Untitled note'}</strong>
              <span>{documentText(note.contentJson).slice(0, 72) || 'Blank note'}</span>
              <button className={styles.secondaryButton} onClick={() => onRestore(note)} disabled={busy}>
                <RotateCcw className="icon" size={15} aria-hidden="true" />
                <span>Restore</span>
              </button>
              <button className={styles.dangerButton} onClick={() => onPermanentDelete(note)} disabled={busy}>
                <Trash2 className="icon" size={15} aria-hidden="true" />
                <span>Delete permanently</span>
              </button>
            </div>
          ))}
        </div>
      ) : ['favorites', 'archive', 'tags'].includes(view) ? (
        collectionLoading ? (
          <div className={styles.empty} aria-live="polite">Loading {view}...</div>
        ) : view === 'tags' && !selectedTagId ? (
          <div className={styles.tagBrowse}>
            <label htmlFor="browse-tag">Browse notes by tag</label>
            <select id="browse-tag" value={selectedTagId} onChange={(event) => onTagChange(event.target.value)}>
              <option value="">Choose a tag</option>
              {availableTags.map((tag) => <option value={tag.id} key={tag.id}>{tag.name}</option>)}
            </select>
          </div>
        ) : collectionNotes.length === 0 ? (
          <EmptyState styles={styles} title="No notes here.">Notes matching this view will appear here.</EmptyState>
        ) : (
          <NoteList styles={styles} notes={collectionNotes} label={`${view} notes`} onOpen={onOpenNote} />
        )
      ) : notes.length === 0 ? (
        <EmptyState styles={styles} title="Your workspace is clear.">Create a note to begin capturing your thoughts.</EmptyState>
      ) : (
        <NoteList styles={styles} notes={notes} label="Your notes" selectedId={selectedId} onSelect={onSelectNote} />
      )}
    </section>
  );
}
