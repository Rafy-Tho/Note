import { Outlet, useSearchParams } from 'react-router-dom';
import { Brand } from '../../components/common/Brand/Brand.jsx';
import styles from '../App.module.css';

export function AuthLayout() {
  const [searchParams] = useSearchParams();
  const authError = searchParams.get('authError');

  return (
    <main className={styles.authShell}>
      <aside className={styles.authPanel}>
        <div className={styles.authPanelTop}>
          <Brand />
          <div className={styles.badge}>
            <span /> v2.4.0 / private
          </div>
        </div>
        <div className={styles.authContent}>
          <Outlet context={{ authError }} />
        </div>
        <div className={styles.footer}>
          <span /> Strict private storage protocol
          <span /> No telemetry · No trackers
        </div>
      </aside>
      <div className={styles.preview}>
        <div className={styles.previewGrid} aria-hidden="true" />
        <div className={styles.previewTopline}>
          <span>
            <b>SYS_SPEC</b> 1440px / 3-PANEL WORKSPACE
          </span>
        </div>
        <div className={styles.previewStage}>
          <div className={styles.previewWindow}>
            <div className={styles.windowBar}>
              <div className={styles.windowTitle}>
                <span className={styles.windowDots}>
                  <i />
                  <i />
                  <i />
                </span>
                workspace_root / distributed_sync.md
              </div>
              <span className={styles.windowStatus}>
                <i /> Saved (Local WAL)
              </span>
            </div>
            <div className={styles.windowBody}>
              <div className={styles.miniSidebar}>
                <strong>+ New Note</strong>
                <span className={styles.miniActive}>
                  ≡ Notes <em>34</em>
                </span>
                <span>
                  ☆ Favorites <em>5</em>
                </span>
                <span>
                  ↧ Archive <em>12</em>
                </span>
                <span>
                  ⌫ Trash <em>3</em>
                </span>
                <small>NOTEBOOKS</small>
                <span>▸ Architecture</span>
                <span>▸ Journal</span>
              </div>
              <div className={styles.miniEditor}>
                <div className={styles.miniTags}>
                  <span>#distributed-db</span>
                  <span>#security</span>
                  <small>Oct 14, 2024 · 1,420 words</small>
                </div>
                <h2>Distributed State Sync &amp; Conflict Resolution</h2>
                <p>
                  When syncing notes across partitioned edge clients,
                  deterministic state convergence is non-negotiable.
                </p>
                <code>
                  <b>type</b> DocumentState = &#123; id: string; version:
                  number; &#125;
                </code>
                <div className={styles.miniFooter}>
                  <span>LN 42, COL 88 · UTF-8 Markdown</span>
                  <b>E2EE Verified · AES-256</b>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.callouts}>
            <div>
              <b>01 // Zero Knowledge</b>
              <span>
                Private notes are encrypted locally before persistent commit.
              </span>
            </div>
            <div>
              <b>02 // Writing-First</b>
              <span>
                Dominant distraction-free editor with instant autosave.
              </span>
            </div>
            <div>
              <b>03 // Fast Tri-Pane</b>
              <span>Organization across notebooks, tags, and search.</span>
            </div>
          </div>
        </div>
        <div className={styles.previewFooter}>
          <span>Strict Private Storage Protocol</span>
          <span>No telemetry · No trackers · Single tenant</span>
        </div>
      </div>
    </main>
  );
}
