import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { tagsApi } from '../services/tagsApi.js';
import styles from '../../workspace/components/Workspace.module.css';

export function TagControls({
  noteId,
  tags,
  availableTags = [],
  tagsLoading = false,
  onTagsChange,
  disabled = false,
}) {
  const [selectedTagId, setSelectedTagId] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();
  const assignedIds = new Set(tags.map((tag) => tag.id));

  useEffect(() => {
    setSelectedTagId('');
    setError(null);
  }, [noteId]);

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
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'tags'],
      });
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
        {tagsLoading && (
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
                <X className="icon" size={13} aria-hidden="true" />
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
          disabled={disabled || tagsLoading}
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
          <Plus className="icon" size={14} aria-hidden="true" />
          <span>Add tag</span>
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
            <Plus className="icon" size={14} aria-hidden="true" />
            <span>Create</span>
          </button>
        </form>
      </div>
    </section>
  );
}
