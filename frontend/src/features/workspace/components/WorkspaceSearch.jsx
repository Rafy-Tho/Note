import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { useWorkspaceSearch } from '../hooks/useWorkspaceSearch.js';

function EmptyState({ styles, title, children }) {
  return (
    <div className={styles.empty}>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

export function WorkspaceSearch({ styles, onOpenResult }) {
  const search = useWorkspaceSearch();

  return (
    <>
      <form className={styles.searchForm} onSubmit={search.submitSearch}>
        <input
          aria-label="Search notes"
          value={search.query}
          onChange={(event) => search.updateQuery(event.target.value)}
          placeholder="Search title, content, or tags"
        />
        <button className={styles.primaryButton} type="submit">
          <Search className="icon" size={15} aria-hidden="true" />
          <span>Search</span>
        </button>
      </form>
      {search.error && <Alert>{search.error}</Alert>}
      {search.status === 'loading' ? (
        <div className={styles.empty} aria-live="polite">
          Searching...
        </div>
      ) : search.results.length === 0 ? (
        <EmptyState
          styles={styles}
          title={search.query ? 'No notes found.' : 'Search your notes.'}
        >
          Search active and archived notes by title, content, or tag.
        </EmptyState>
      ) : (
        <>
          <div className={styles.searchResults} aria-label="Search results">
            {search.results.map((result) => (
              <button
                className={styles.searchResult}
                key={result.id}
                type="button"
                onClick={() => onOpenResult(result)}
              >
                <strong>{result.title || 'Untitled note'}</strong>
                <span>
                  {result.state} ·{' '}
                  {result.tags.map((tag) => tag.name).join(', ') || 'No tags'}
                </span>
              </button>
            ))}
          </div>
          <div className={styles.pagination}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => void search.submitSearch(null, search.page - 1)}
              disabled={search.page === 1}
            >
              <ChevronLeft className="icon" size={15} aria-hidden="true" />
              <span>Previous</span>
            </button>
            <span>Page {search.page}</span>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => void search.submitSearch(null, search.page + 1)}
              disabled={search.page * 20 >= search.total}
            >
              <span>Next</span>
              <ChevronRight className="icon" size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
