import { memo, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, X } from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { tagsApi } from '../services/tagsApi.js';
import styles from '../../workspace/components/Workspace.module.css';

export const TagControls = memo(function TagControls({
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
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const assignedIds = new Set(tags.map((tag) => tag.id));

  useEffect(() => {
    setSelectedTagId('');
    setError(null);
    setShowCreate(false);
  }, [noteId]);

  async function assign(tagId) {
    if (!tagId) return false;
    setError(null);
    try {
      const result = await tagsApi.assign(noteId, tagId);
      onTagsChange(result.tags);
      setSelectedTagId('');
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function createAndAssign(event) {
    event.preventDefault();
    const name = newTagName.trim();
    if (!name) {
      setError('Enter a tag name.');
      return;
    }
    setError(null);
    try {
      const tag = await tagsApi.create(name);
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'tags'],
      });
      const assigned = await assign(tag.id);
      if (assigned) {
        setNewTagName('');
        setShowCreate(false);
      }
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
        <span className={styles.contextLabel}>
          <Tag className="icon" size={14} aria-hidden="true" />
          <span>Tags</span>
        </span>
        {tagsLoading && <span className={styles.tagMeta}>Loading...</span>}
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
          className={styles.contextSelect}
          id={`add-tag-${noteId}`}
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
          className={styles.contextButton}
          type="button"
          onClick={() => assign(selectedTagId)}
          disabled={disabled || !selectedTagId}
        >
          <Plus className="icon" size={14} aria-hidden="true" />
          <span>Add tag</span>
        </button>
        <button
          className={styles.contextButton}
          type="button"
          onClick={() => setShowCreate((current) => !current)}
          aria-expanded={showCreate}
          aria-controls={`tag-create-${noteId}`}
          aria-label="Create new tag"
          disabled={disabled}
        >
          <Plus className="icon" size={14} aria-hidden="true" />
          <span>New</span>
        </button>
        {showCreate && (
          <form
            className={styles.contextCreateForm}
            id={`tag-create-${noteId}`}
            onSubmit={createAndAssign}
          >
            <label
              className={styles.visuallyHidden}
              htmlFor={`new-tag-${noteId}`}
            >
              New tag name
            </label>
            <input
              id={`new-tag-${noteId}`}
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="New tag"
              autoComplete="off"
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
        )}
      </div>
    </section>
  );
});
