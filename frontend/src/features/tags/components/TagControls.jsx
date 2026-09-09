import { useEffect, useState } from 'react';
import { Alert } from '../../../components/Alert/Alert.jsx';
import { tagsApi } from '../api/tagsApi.js';
import styles from '../../workspace/components/Workspace.module.css';

export function TagControls({ noteId, tags, onTagsChange, disabled = false }) {
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const assignedIds = new Set(tags.map((tag) => tag.id));

  useEffect(() => {
    tagsApi
      .list()
      .then((result) => {
        setAvailableTags(result);
        setStatus('ready');
      })
      .catch((requestError) => {
        setError(requestError.message);
        setStatus('ready');
      });
  }, []);

  async function assign(tagId) {
    if (!tagId) return;
    setError(null);
    try {
      const result = await tagsApi.assign(noteId, tagId);
      onTagsChange(result.tags);
      setSelectedTagId('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function createAndAssign(event) {
    event.preventDefault();
    setError(null);
    try {
      const tag = await tagsApi.create(newTagName);
      setAvailableTags((current) =>
        current.some((item) => item.id === tag.id)
          ? current
          : [...current, tag],
      );
      await assign(tag.id);
      setNewTagName('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function remove(tagId) {
    setError(null);
    try {
      const result = await tagsApi.remove(noteId, tagId);
      onTagsChange(result.tags);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className={styles.tagControls} aria-label="Note tags">
      <div className={styles.tagHeader}>
        <span className={styles.tagLabel}>Tags</span>
        {status === 'loading' && (
          <span className={styles.tagMeta}>Loading...</span>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      <div className={styles.tagList} aria-live="polite">
        {tags.length === 0 ? (
          <span className={styles.tagMeta}>No tags assigned.</span>
        ) : (
          tags.map((tag) => (
            <span className={styles.tagChip} key={tag.id}>
              {tag.name}
              <button
                type="button"
                aria-label={`Remove ${tag.name} tag`}
                onClick={() => remove(tag.id)}
                disabled={disabled}
              >
                x
              </button>
            </span>
          ))
        )}
      </div>
      <div className={styles.tagActions}>
        <select
          aria-label="Existing tags"
          value={selectedTagId}
          onChange={(event) => setSelectedTagId(event.target.value)}
          disabled={disabled || status === 'loading'}
        >
          <option value="">Choose a tag</option>
          {availableTags
            .filter((tag) => !assignedIds.has(tag.id))
            .map((tag) => (
              <option value={tag.id} key={tag.id}>
                {tag.name}
              </option>
            ))}
        </select>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => assign(selectedTagId)}
          disabled={disabled || !selectedTagId}
        >
          Add tag
        </button>
        <form className={styles.newTagForm} onSubmit={createAndAssign}>
          <input
            aria-label="New tag name"
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            placeholder="New tag"
            disabled={disabled}
          />
          <button
            className={styles.secondaryButton}
            type="submit"
            disabled={disabled}
          >
            Create
          </button>
        </form>
      </div>
    </section>
  );
}
