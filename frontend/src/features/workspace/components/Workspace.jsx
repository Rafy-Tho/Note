import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  collectionPath,
  mobilePaneFromNoteId,
  notePath,
  searchNotePath,
  viewFromPath,
} from '../routing.js';
import { WorkspaceCollection } from './WorkspaceCollection.jsx';
import { WorkspaceEditor } from './WorkspaceEditor.jsx';
import { WorkspaceShell } from './WorkspaceShell.jsx';
import styles from './Workspace.module.css';

export function Workspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const view = viewFromPath(location.pathname);
  const selectedTagId = params.tagId ?? '';
  const mobilePane = mobilePaneFromNoteId(params.noteId);
  const [editorState, setEditorState] = useState({
    isDirty: false,
    isSaving: false,
  });
  const allowBlockedNavigationRef = useRef(false);
  const { isDirty, isSaving } = editorState;
  const blocker = useBlocker(isDirty && !isSaving);

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

  const onEditorStateChange = useCallback((nextState) => {
    setEditorState((current) =>
      current.isDirty === nextState.isDirty &&
      current.isSaving === nextState.isSaving
        ? current
        : nextState,
    );
  }, []);

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

  const selectNote = useCallback(
    (note) => {
      if (
        isSaving ||
        note.id === params.noteId ||
        !confirmNavigation()
      )
        return false;
      allowNextNavigation();
      navigate(notePath(view, note.id, selectedTagId));
      return true;
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
      if (isSaving || view === nextView || !confirmNavigation()) return false;
      allowNextNavigation();
      navigate(collectionPath(nextView));
      return true;
    },
    [allowNextNavigation, confirmNavigation, isSaving, navigate, view],
  );

  const openSearchResult = useCallback(
    (result) => {
      if (isSaving || !confirmNavigation()) return false;
      allowNextNavigation();
      navigate(searchNotePath(result.id, searchParams));
      return true;
    },
    [allowNextNavigation, confirmNavigation, isSaving, navigate, searchParams],
  );

  const goBackToCollection = useCallback(() => {
    if (!confirmNavigation()) return false;
    allowNextNavigation();
    navigate(collectionPath(view, selectedTagId));
    return true;
  }, [allowNextNavigation, confirmNavigation, navigate, selectedTagId, view]);

  const openTag = useCallback(
    (tagId) => {
      if (isSaving || !confirmNavigation()) return false;
      allowNextNavigation();
      navigate(collectionPath('tags', tagId));
      return true;
    },
    [allowNextNavigation, confirmNavigation, isSaving, navigate],
  );

  return (
    <main className={styles.workspace} aria-labelledby="workspace-title">
      <WorkspaceShell
        styles={styles}
        view={view}
        canLeaveDraft={confirmNavigation}
        onSwitchView={switchView}
      >
        <WorkspaceCollection
          styles={styles}
          view={view}
          mobilePane={mobilePane}
          selectedId={params.noteId}
          selectedTagId={selectedTagId}
          isDirty={isDirty}
          isSaving={isSaving}
          allowNextNavigation={allowNextNavigation}
          onSelectNote={selectNote}
          onOpenNote={selectNote}
          onTagChange={openTag}
          onSearchOpen={openSearchResult}
        />
        <WorkspaceEditor
          styles={styles}
          mobilePane={mobilePane}
          view={view}
          noteId={params.noteId}
          canLeaveDraft={confirmNavigation}
          allowNextNavigation={allowNextNavigation}
          onBack={goBackToCollection}
          onEditorStateChange={onEditorStateChange}
        />
      </WorkspaceShell>
    </main>
  );
}
