import { useEffect, useRef, useState } from 'react';
import { Folder, Plus, Settings2, Tag, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '../../../components/common/Alert/Alert.jsx';
import { Dialog } from '../../../components/common/Dialog/Dialog.jsx';
import { useToast } from '../../../components/common/Toast/Toast.jsx';
import { tagsApi } from '../../tags/services/tagsApi.js';
import { useNoteMutations } from '../hooks/useNoteMutations.js';
import { useNotebookMutations } from '../hooks/useNotebookMutations.js';

export function NoteOrganizationControls({
  styles,
  note,
  notebooks,
  availableTags,
  tagsLoading,
  onNoteUpdated,
  onTagsChange,
  disabled = false,
}) {
  const queryClient = useQueryClient();
  const noteMutations = useNoteMutations();
  const notebookMutations = useNotebookMutations();
  const renameInputRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { notify } = useToast();
  const tags = note.tags ?? [];
  const assignedTagIds = new Set(tags.map((tag) => tag.id));
  const mutationBusy =
    noteMutations.assignNotebook.isPending ||
    notebookMutations.createNotebook.isPending ||
    notebookMutations.renameNotebook.isPending ||
    notebookMutations.deleteNotebook.isPending;
  const busy = disabled || mutationBusy;

  useEffect(() => {
    setOpenPanel(null);
    setError(null);
    setSelectedTagId('');
    setShowNewNotebook(false);
    setShowNewTag(false);
  }, [note.id]);

  function togglePanel(panel) {
    setError(null);
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  async function assignNotebook(notebookId) {
    if (busy) return;
    setError(null);
    try {
      const updated = await noteMutations.assignNotebook.mutateAsync({
        noteId: note.id,
        notebookId: notebookId || null,
      });
      onNoteUpdated(updated);
      notify('Notebook updated.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function createNotebook(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.notebookName.value.trim();
    if (!name || busy) return;
    setError(null);
    try {
      const created = await notebookMutations.createNotebook.mutateAsync(name);
      if (created?.id) await assignNotebook(created.id);
      form.reset();
      setShowNewNotebook(false);
      notify('Notebook created.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function openRename(notebook) {
    setRenameTarget(notebook);
    setRenameName(notebook.name);
  }

  async function renameNotebook(event) {
    event.preventDefault();
    const name = renameName.trim();
    if (!renameTarget || !name || name === renameTarget.name || busy) return;
    setError(null);
    try {
      await notebookMutations.renameNotebook.mutateAsync({
        notebookId: renameTarget.id,
        name,
      });
      setRenameTarget(null);
      notify('Notebook renamed.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function openDelete(notebook) {
    if (!busy) setDeleteTarget(notebook);
  }

  async function deleteNotebook() {
    if (!deleteTarget) return;
    setError(null);
    try {
      await notebookMutations.deleteNotebook.mutateAsync(deleteTarget.id);
      if (note.notebookId === deleteTarget.id) await assignNotebook('');
      setDeleteTarget(null);
      notify('Notebook deleted.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function assignTag(tagId) {
    if (!tagId || disabled) return;
    setError(null);
    try {
      const result = await tagsApi.assign(note.id, tagId);
      onTagsChange(result.tags);
      setSelectedTagId('');
      notify('Tag added.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function createTag(event) {
    event.preventDefault();
    const name = newTagName.trim();
    if (!name) {
      setError('Enter a tag name.');
      return;
    }
    setError(null);
    try {
      const tag = await tagsApi.create(name);
      await queryClient.invalidateQueries({ queryKey: ['workspace', 'tags'] });
      await assignTag(tag.id);
      setNewTagName('');
      setShowNewTag(false);
      notify('Tag created.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeTag(tagId) {
    setError(null);
    try {
      const result = await tagsApi.remove(note.id, tagId);
      onTagsChange(result.tags);
      notify('Tag removed.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className={styles.organizationControls}>
      <div className={styles.organizationButtons} role="group" aria-label="Note organization">
        <button
          className={`${styles.organizationButton} ${openPanel === 'notebooks' ? styles.organizationButtonActive : ''}`}
          type="button"
          aria-expanded={openPanel === 'notebooks'}
          onClick={() => togglePanel('notebooks')}
          disabled={disabled}
        >
          <Folder className="icon" size={14} aria-hidden="true" />
          <span>Notebooks</span>
        </button>
        <button
          className={`${styles.organizationButton} ${openPanel === 'tags' ? styles.organizationButtonActive : ''}`}
          type="button"
          aria-expanded={openPanel === 'tags'}
          onClick={() => togglePanel('tags')}
          disabled={disabled}
        >
          <Tag className="icon" size={14} aria-hidden="true" />
          <span>Tags</span>
          {tags.length > 0 && <span className={styles.organizationCount}>{tags.length}</span>}
        </button>
      </div>

      {openPanel && (
        <div className={styles.organizationPanel} aria-label={`${openPanel} controls`}>
          {error && <Alert>{error}</Alert>}
          {openPanel === 'notebooks' ? (
            <>
              <div className={styles.organizationPanelHeader}>
                <span className={styles.contextLabel}>Notebook</span>
                <button
                  className={styles.contextButton}
                  type="button"
                  onClick={() => setShowNewNotebook((current) => !current)}
                  aria-expanded={showNewNotebook}
                  disabled={busy}
                >
                  <Plus className="icon" size={14} aria-hidden="true" />
                  <span>New</span>
                </button>
                <button
                  className={styles.contextButton}
                  type="button"
                  onClick={() => setOpenPanel('manage')}
                  disabled={busy || notebooks.length === 0}
                >
                  <Settings2 className="icon" size={14} aria-hidden="true" />
                  <span>Manage</span>
                </button>
              </div>
              <select
                className={styles.contextSelect}
                aria-label="Notebook"
                value={note.notebookId ?? ''}
                onChange={(event) => void assignNotebook(event.target.value)}
                disabled={busy}
              >
                <option value="">No notebook</option>
                {notebooks.map((notebook) => (
                  <option value={notebook.id} key={notebook.id}>{notebook.name}</option>
                ))}
              </select>
              {showNewNotebook && (
                <form className={styles.organizationForm} onSubmit={createNotebook}>
                  <label className={styles.visuallyHidden} htmlFor={`new-notebook-${note.id}`}>New notebook name</label>
                  <input id={`new-notebook-${note.id}`} name="notebookName" placeholder="New notebook" autoComplete="off" disabled={busy} />
                  <button className={styles.secondaryButton} type="submit" disabled={busy}>Create</button>
                </form>
              )}
            </>
          ) : openPanel === 'manage' ? (
            <>
              <div className={styles.organizationPanelHeader}>
                <span className={styles.contextLabel}>Manage notebooks</span>
                <button className={styles.textButton} type="button" onClick={() => setOpenPanel('notebooks')}>Back</button>
              </div>
              <div className={styles.notebookManage}>
                {notebooks.map((notebook) => (
                  <div className={styles.notebookItem} key={notebook.id}>
                    <span>{notebook.name}</span>
                    <button className={styles.textButton} type="button" onClick={() => openRename(notebook)} disabled={busy}>Rename</button>
                    <button className={`${styles.textButton} ${styles.textDanger}`} type="button" onClick={() => openDelete(notebook)} disabled={busy}>Delete</button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={styles.organizationPanelHeader}>
                <span className={styles.contextLabel}>Tags</span>
                {tagsLoading && <span className={styles.tagMeta}>Loading...</span>}
                <button className={styles.contextButton} type="button" onClick={() => setShowNewTag((current) => !current)} disabled={disabled}>
                  <Plus className="icon" size={14} aria-hidden="true" />
                  <span>New</span>
                </button>
              </div>
              <div className={styles.tagList} aria-live="polite">
                {tags.length === 0 ? <span className={styles.tagMeta}>No tags assigned.</span> : tags.map((tag) => (
                  <span className={styles.tagChip} key={tag.id}>
                    {tag.name}
                    <button type="button" aria-label={`Remove ${tag.name} tag`} onClick={() => void removeTag(tag.id)} disabled={disabled}>
                      <X className="icon" size={13} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
              <div className={styles.organizationTagAssign}>
                <select className={styles.contextSelect} aria-label="Existing tags" value={selectedTagId} onChange={(event) => setSelectedTagId(event.target.value)} disabled={disabled || tagsLoading}>
                  <option value="">Choose a tag</option>
                  {availableTags.filter((tag) => !assignedTagIds.has(tag.id)).map((tag) => (
                    <option value={tag.id} key={tag.id}>{tag.name}</option>
                  ))}
                </select>
                <button className={styles.secondaryButton} type="button" onClick={() => void assignTag(selectedTagId)} disabled={disabled || !selectedTagId}>Add tag</button>
              </div>
              {showNewTag && (
                <form className={styles.organizationForm} onSubmit={createTag}>
                  <label className={styles.visuallyHidden} htmlFor={`new-tag-${note.id}`}>New tag name</label>
                  <input id={`new-tag-${note.id}`} value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="New tag" autoComplete="off" disabled={disabled} />
                  <button className={styles.secondaryButton} type="submit" disabled={disabled}>Create</button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {renameTarget && (
        <Dialog
          title="Rename notebook"
          description="Choose a clear name for this notebook."
          onClose={() => setRenameTarget(null)}
          initialFocusRef={renameInputRef}
          actions={<><button className={styles.secondaryButton} type="button" onClick={() => setRenameTarget(null)}>Cancel</button><button className={styles.primaryButton} type="submit" form="rename-notebook-form" disabled={busy}>Rename</button></>}
        >
          <form id="rename-notebook-form" onSubmit={renameNotebook}>
            <label className={styles.visuallyHidden} htmlFor="rename-notebook-name">Notebook name</label>
            <input ref={renameInputRef} id="rename-notebook-name" value={renameName} onChange={(event) => setRenameName(event.target.value)} autoComplete="off" />
          </form>
        </Dialog>
      )}
      {deleteTarget && (
        <Dialog
          title={`Delete ${deleteTarget.name}?`}
          description="Notes in this notebook will remain in your workspace without a notebook."
          onClose={() => setDeleteTarget(null)}
          actions={<><button className={styles.secondaryButton} type="button" onClick={() => setDeleteTarget(null)}>Cancel</button><button className={styles.dangerButton} type="button" onClick={() => void deleteNotebook()}>Delete notebook</button></>}
        />
      )}
    </div>
  );
}
