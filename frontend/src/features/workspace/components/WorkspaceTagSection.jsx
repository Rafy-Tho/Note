import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Tag,
} from 'lucide-react';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { Dialog } from '../../../components/common/Dialog/Dialog.jsx';
import { useToast } from '../../../components/common/Toast/Toast.jsx';
import { tagsApi } from '../../tags/services/tagsApi.js';
import { useWorkspaceTagsQuery } from '../hooks/useWorkspaceQueries.js';

export function WorkspaceTagSection({
  styles,
  counts = [],
  selectedTagId,
  onSelectTag,
}) {
  const tagsQuery = useWorkspaceTagsQuery();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const renameInputRef = useRef(null);
  const [expanded, setExpanded] = useState(true);
  const [menuTagId, setMenuTagId] = useState(null);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const tags = tagsQuery.data ?? [];
  const countById = new Map(counts.map((item) => [item.id, item.count]));
  const busy = tagsQuery.isFetching;

  function openRename(tag) {
    setMenuTagId(null);
    setRenameTarget(tag);
    setRenameName(tag.name);
  }

  async function createTag(event) {
    event.preventDefault();
    const name = event.currentTarget.elements.tagName.value.trim();
    if (!name) return;
    setError(null);
    try {
      await tagsApi.create(name);
      await tagsQuery.refetch();
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'sidebar-counts'],
      });
      setCreateOpen(false);
      notify('Tag created.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function renameTag(event) {
    event.preventDefault();
    const name = renameName.trim();
    if (!renameTarget || !name || name === renameTarget.name) return;
    setError(null);
    try {
      await tagsApi.rename(renameTarget.id, name);
      await tagsQuery.refetch();
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'sidebar-counts'],
      });
      setRenameTarget(null);
      notify('Tag renamed.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteTag() {
    if (!deleteTarget) return;
    setError(null);
    try {
      await tagsApi.delete(deleteTarget.id);
      await tagsQuery.refetch();
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'sidebar-counts'],
      });
      setDeleteTarget(null);
      notify('Tag deleted.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className={styles.sidebarTags} aria-label="Tags">
      <div className={styles.sidebarSectionHeader}>
        <button
          className={styles.sidebarSectionToggle}
          type="button"
          aria-expanded={expanded}
          aria-controls="workspace-sidebar-tags"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? (
            <ChevronDown className="icon" size={14} aria-hidden="true" />
          ) : (
            <ChevronRight className="icon" size={14} aria-hidden="true" />
          )}
          <Tag className="icon" size={14} aria-hidden="true" />
          <span>Tags</span>
        </button>
        <button
          className={styles.sidebarAddButton}
          type="button"
          aria-label="Create tag"
          onClick={() => setCreateOpen(true)}
          disabled={busy}
        >
          <Plus className="icon" size={14} aria-hidden="true" />
        </button>
      </div>
      {expanded && (
        <div className={styles.sidebarTagList} id="workspace-sidebar-tags">
          {error && <Alert>{error}</Alert>}
          {tagsQuery.isLoading ? (
            <span className={styles.sidebarTagEmpty}>Loading tags...</span>
          ) : tagsQuery.error ? (
            <Alert>{tagsQuery.error.message}</Alert>
          ) : tags.length === 0 ? (
            <span className={styles.sidebarTagEmpty}>No tags yet.</span>
          ) : (
            tags.map((tag) => (
              <div className={styles.sidebarTagRow} key={tag.id}>
                <button
                  className={`${styles.sidebarTagButton} ${selectedTagId === tag.id ? styles.sidebarTagSelected : ''}`}
                  type="button"
                  aria-label={`${tag.name}, ${countById.get(tag.id) ?? 0} notes`}
                  onClick={() => onSelectTag(tag.id)}
                >
                  <span>{tag.name}</span>
                  <span className={styles.countBadge} aria-hidden="true">
                    {countById.get(tag.id) ?? 0}
                  </span>
                </button>
                <button
                  className={styles.sidebarTagMenuButton}
                  type="button"
                  aria-label={`Manage ${tag.name} tag`}
                  aria-expanded={menuTagId === tag.id}
                  onClick={() =>
                    setMenuTagId((current) =>
                      current === tag.id ? null : tag.id,
                    )
                  }
                >
                  <MoreHorizontal
                    className="icon"
                    size={14}
                    aria-hidden="true"
                  />
                </button>
                {menuTagId === tag.id && (
                  <div className={styles.sidebarTagMenu} role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openRename(tag)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuTagId(null);
                        setDeleteTarget(tag);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      {createOpen && (
        <Dialog
          title="Create tag"
          description="Use a short name that will be easy to find in the sidebar."
          onClose={() => setCreateOpen(false)}
          actions={
            <>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                type="submit"
                form="sidebar-create-tag"
              >
                Create tag
              </button>
            </>
          }
        >
          <form id="sidebar-create-tag" onSubmit={createTag}>
            <label htmlFor="sidebar-tag-name">Tag name</label>
            <input
              id="sidebar-tag-name"
              name="tagName"
              autoComplete="off"
              autoFocus
            />
          </form>
        </Dialog>
      )}
      {renameTarget && (
        <Dialog
          title="Rename tag"
          description="Choose a new name for this tag."
          onClose={() => setRenameTarget(null)}
          initialFocusRef={renameInputRef}
          actions={
            <>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setRenameTarget(null)}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                type="submit"
                form="sidebar-rename-tag"
              >
                Rename
              </button>
            </>
          }
        >
          <form id="sidebar-rename-tag" onSubmit={renameTag}>
            <label htmlFor="sidebar-rename-tag-name">Tag name</label>
            <input
              ref={renameInputRef}
              id="sidebar-rename-tag-name"
              value={renameName}
              onChange={(event) => setRenameName(event.target.value)}
              autoComplete="off"
            />
          </form>
        </Dialog>
      )}
      {deleteTarget && (
        <Dialog
          title={`Delete ${deleteTarget.name}?`}
          description="The tag will be removed from the sidebar and all notes. Notes will not be deleted."
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                onClick={() => void deleteTag()}
              >
                Delete tag
              </button>
            </>
          }
        />
      )}
    </section>
  );
}
