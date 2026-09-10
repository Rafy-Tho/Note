import { useCallback, useEffect, useRef, useState } from 'react';

function draftSignature(note) {
  return JSON.stringify({ title: note.title, contentJson: note.contentJson });
}

export function useAutosave({ note, saveNote, debounceMs = 800, onError }) {
  const [draft, setDraft] = useState(note);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [conflict, setConflict] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const latestDraftRef = useRef(note);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (
      note?.id &&
      latestDraftRef.current?.id === note.id &&
      (dirtyRef.current || savingRef.current)
    ) {
      return;
    }

    window.clearTimeout(saveTimerRef.current);
    setDraft(note);
    latestDraftRef.current = note;
    dirtyRef.current = false;
    queuedRef.current = false;
    setIsDirty(false);
    setSaveStatus('Saved');
    setConflict(false);
  }, [note]);

  const save = useCallback(
    async (requestedDraft = latestDraftRef.current) => {
      if (!requestedDraft || !dirtyRef.current) return;
      if (savingRef.current) {
        queuedRef.current = true;
        return;
      }

      window.clearTimeout(saveTimerRef.current);
      savingRef.current = true;
      setIsSaving(true);
      setSaveStatus('Saving');
      setConflict(false);
      const snapshot = requestedDraft;

      try {
        const updated = await saveNote(snapshot);
        const latest = latestDraftRef.current;
        if (latest?.id !== snapshot.id) return;
        const changedWhileSaving =
          latest && draftSignature(latest) !== draftSignature(snapshot);
        const nextDraft = changedWhileSaving
          ? { ...latest, revision: updated.revision }
          : { ...updated, tags: latest?.tags ?? updated.tags };

        latestDraftRef.current = nextDraft;
        setDraft(nextDraft);
        dirtyRef.current = Boolean(changedWhileSaving);
        setIsDirty(Boolean(changedWhileSaving));
        setSaveStatus(changedWhileSaving ? 'Unsaved Changes' : 'Saved');
      } catch (requestError) {
        setErrorState(requestError);
        onError?.(requestError);
      } finally {
        savingRef.current = false;
        setIsSaving(false);
        if (dirtyRef.current && queuedRef.current) {
          queuedRef.current = false;
          void save(latestDraftRef.current);
        }
      }
    },
    [onError, saveNote],
  );

  useEffect(() => {
    if (!draft || !dirtyRef.current) return undefined;
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => void save(), debounceMs);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [debounceMs, draft, save]);

  useEffect(
    () => () => window.clearTimeout(saveTimerRef.current),
    [],
  );

  function setErrorState(requestError) {
    setConflict(requestError.code === 'CONFLICT');
    setSaveStatus('Save Failed');
  }

  const updateDraft = useCallback((field, value) => {
    const nextDraft = { ...latestDraftRef.current, [field]: value };
    latestDraftRef.current = nextDraft;
    dirtyRef.current = true;
    setDraft(nextDraft);
    setIsDirty(true);
    setSaveStatus('Unsaved Changes');
    setConflict(false);
  }, []);

  const replaceDraft = useCallback((nextDraft, { dirty = false } = {}) => {
    latestDraftRef.current = nextDraft;
    dirtyRef.current = dirty;
    setDraft(nextDraft);
    setIsDirty(dirty);
    setSaveStatus(dirty ? 'Unsaved Changes' : 'Saved');
    setConflict(false);
  }, []);

  const replaceDraftField = useCallback(
    (field, value) => {
      replaceDraft(
        { ...latestDraftRef.current, [field]: value },
        { dirty: dirtyRef.current },
      );
    },
    [replaceDraft],
  );

  return {
    draft,
    updateDraft,
    replaceDraft,
    replaceDraftField,
    save,
    saveStatus,
    isDirty,
    isSaving,
    conflict,
  };
}
