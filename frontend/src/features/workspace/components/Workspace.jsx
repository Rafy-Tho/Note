import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Dialog } from '../../../components/common/Dialog/Dialog.jsx';
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
  const [editorState, setEditorState] = useState({ isDirty: false, isSaving: false });
  const editorStateRef = useRef(editorState);
  const allowBlockedNavigationRef = useRef(false);
  const pendingNavigationRef = useRef(null);
  const blockedNavigationRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { isDirty, isSaving } = editorState;
  const blocker = useBlocker(isDirty && !isSaving);

  useEffect(() => {
    if (blocker.state !== 'blocked' || confirmOpen) return;
    if (allowBlockedNavigationRef.current) {
      allowBlockedNavigationRef.current = false;
      blocker.proceed();
      return;
    }
    blockedNavigationRef.current = blocker;
    setConfirmOpen(true);
  }, [blocker, confirmOpen]);

  const onEditorStateChange = useCallback((nextState) => {
    editorStateRef.current = nextState;
    setEditorState((current) =>
      current.isDirty === nextState.isDirty && current.isSaving === nextState.isSaving
        ? current
        : nextState,
    );
  }, []);

  const confirmNavigation = useCallback((onConfirm) => {
    if (!editorStateRef.current.isDirty) {
      onConfirm();
      return true;
    }
    pendingNavigationRef.current = onConfirm;
    setConfirmOpen(true);
    return false;
  }, []);

  const allowNextNavigation = useCallback(() => {
    if (editorStateRef.current.isDirty) allowBlockedNavigationRef.current = true;
  }, []);

  const getEditorState = useCallback(() => editorStateRef.current, []);

  const selectNote = useCallback(
    (note) => {
      const { isSaving: editorIsSaving } = editorStateRef.current;
      if (editorIsSaving || note.id === params.noteId) return false;
      return confirmNavigation(() => {
        allowNextNavigation();
        navigate(notePath(view, note.id, selectedTagId));
      });
    },
    [allowNextNavigation, confirmNavigation, navigate, params.noteId, selectedTagId, view],
  );

  const switchView = useCallback(
    (nextView) => {
      if (editorStateRef.current.isSaving || view === nextView) return false;
      return confirmNavigation(() => {
        allowNextNavigation();
        navigate(collectionPath(nextView));
      });
    },
    [allowNextNavigation, confirmNavigation, navigate, view],
  );

  const openSearchResult = useCallback(
    (result) => {
      if (editorStateRef.current.isSaving) return false;
      return confirmNavigation(() => {
        allowNextNavigation();
        navigate(searchNotePath(result.id, searchParams));
      });
    },
    [allowNextNavigation, confirmNavigation, navigate, searchParams],
  );

  const goBackToCollection = useCallback(
    () =>
      confirmNavigation(() => {
        allowNextNavigation();
        navigate(collectionPath(view, selectedTagId));
      }),
    [allowNextNavigation, confirmNavigation, navigate, selectedTagId, view],
  );

  const openTag = useCallback(
    (tagId) => {
      if (editorStateRef.current.isSaving) return false;
      return confirmNavigation(() => {
        allowNextNavigation();
        navigate(collectionPath('tags', tagId));
      });
    },
    [allowNextNavigation, confirmNavigation, navigate],
  );

  const requestLeave = useCallback(
    (onConfirm = () => {}) => {
      if (!editorStateRef.current.isDirty) {
        onConfirm();
        return true;
      }
      pendingNavigationRef.current = onConfirm;
      setConfirmOpen(true);
      return false;
    },
    [],
  );

  function cancelNavigation() {
    blockedNavigationRef.current?.reset();
    blockedNavigationRef.current = null;
    pendingNavigationRef.current = null;
    setConfirmOpen(false);
  }

  function acceptNavigation() {
    const blocked = blockedNavigationRef.current;
    const pending = pendingNavigationRef.current;
    blockedNavigationRef.current = null;
    pendingNavigationRef.current = null;
    setConfirmOpen(false);
    if (blocked) {
      allowBlockedNavigationRef.current = true;
      blocked.proceed();
    } else {
      pending?.();
    }
  }

  return (
    <main className={styles.workspace} aria-labelledby="workspace-title">
      <WorkspaceShell
        styles={styles}
        view={view}
        canLeaveDraft={requestLeave}
        onSwitchView={switchView}
      >
        <WorkspaceCollection
          styles={styles}
          view={view}
          mobilePane={mobilePane}
          selectedId={params.noteId}
          selectedTagId={selectedTagId}
          getEditorState={getEditorState}
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
          canLeaveDraft={requestLeave}
          allowNextNavigation={allowNextNavigation}
          onBack={goBackToCollection}
          onEditorStateChange={onEditorStateChange}
        />
      </WorkspaceShell>
      {confirmOpen && (
        <Dialog
          title="Leave note?"
          description="You have unsaved changes. Leaving now will discard them."
          onClose={cancelNavigation}
          actions={
            <>
              <button className={styles.secondaryButton} type="button" onClick={cancelNavigation}>
                Stay
              </button>
              <button className={styles.dangerButton} type="button" onClick={acceptNavigation}>
                Leave note
              </button>
            </>
          }
        />
      )}
    </main>
  );
}
