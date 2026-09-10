import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';

export function Dialog({
  title,
  description,
  children,
  actions,
  onClose,
  initialFocusRef,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousActiveElement = document.activeElement;
    const focusTarget = initialFocusRef?.current ?? dialogRef.current;
    focusTarget?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [initialFocusRef, onClose]);

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id="dialog-title">{title}</h2>
          {description && <p id="dialog-description">{description}</p>}
        </header>
        <div className={styles.content}>{children}</div>
        <footer className={styles.actions}>{actions}</footer>
      </section>
    </div>,
    document.body,
  );
}
