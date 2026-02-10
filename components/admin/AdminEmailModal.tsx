'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { EmailDetail } from './admin-types';
import { fullDate } from './admin-utils';

function injectBaseTarget(html: string): string {
  const tag = '<base target="_blank">';
  if (/<head[\s>]/i.test(html)) return html.replace(/<head[\s>][^>]*>/i, '$&' + tag);
  return tag + html;
}

interface Props {
  email: EmailDetail | null;
  loading: boolean;
  onClose: () => void;
  onReply?: (email: EmailDetail) => void;
  onForward?: (email: EmailDetail) => void;
  inline?: boolean;
  desktopHide?: boolean;
}

export default function AdminEmailModal({ email, loading, onClose, onReply, onForward, inline, desktopHide }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.body) {
        iframeRef.current!.style.height = doc.body.scrollHeight + 'px';
      }
    } catch {
      /* cross-origin fallback: keep min-height */
    }
  }, []);

  useEffect(() => {
    if (inline) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, inline]);

  if (!email && !loading) return null;

  // Inline mode: render content without overlay
  if (inline) {
    return (
      <div className="admin-modal-inline">
        {loading ? (
          <div className="admin-modal-loading">Loading email&hellip;</div>
        ) : email ? (
          <>
            <div className="admin-modal-header">
              <div className="admin-modal-meta">
                <strong>From:</strong> {email.from}
              </div>
              <div className="admin-modal-meta">
                <strong>To:</strong> {Array.isArray(email.to) ? email.to.join(', ') : email.to}
              </div>
              <div className="admin-modal-meta">
                <strong>Subject:</strong> {email.subject}
              </div>
              <div className="admin-modal-meta">
                <strong>Date:</strong> {fullDate(email.created_at)}
              </div>
              {email.last_event !== undefined && (
                <div className="admin-modal-meta">
                  <strong>Status:</strong>{' '}
                  <span
                    className={`admin-email-status admin-email-status-${(email.last_event || 'queued').toLowerCase()}`}
                  >
                    {email.last_event || 'queued'}
                  </span>
                </div>
              )}
              {email.attachments && email.attachments.length > 0 && (
                <div className="admin-modal-meta">
                  <strong>Files:</strong>{' '}
                  <span className="admin-attachment-list">
                    {email.attachments.map((a, i) => (
                      <span key={i} className="admin-attachment-chip">
                        {a.filename}
                        {a.size != null && (
                          <span className="admin-attachment-size"> ({Math.round(a.size / 1024)}KB)</span>
                        )}
                      </span>
                    ))}
                  </span>
                </div>
              )}
              <div className="admin-modal-actions">
                {onReply && (
                  <button
                    className="admin-compose-btn"
                    onClick={() => {
                      onReply(email);
                      onClose();
                    }}
                  >
                    Reply
                  </button>
                )}
                {onForward && (
                  <button
                    className="admin-refresh-btn"
                    onClick={() => {
                      onForward(email);
                      onClose();
                    }}
                  >
                    Forward
                  </button>
                )}
              </div>
            </div>
            <div className="admin-modal-body">
              {email.html ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={injectBaseTarget(email.html)}
                  title="Email preview"
                  className="admin-modal-iframe"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  onLoad={handleIframeLoad}
                />
              ) : (
                <pre className="admin-modal-text">{email.text || '(no content)'}</pre>
              )}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`admin-modal-overlay${desktopHide ? ' admin-modal-overlay-desktop-hide' : ''}`} onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose}>
          &times;
        </button>
        {loading ? (
          <div className="admin-modal-loading">Loading email&hellip;</div>
        ) : email ? (
          <>
            <div className="admin-modal-header">
              <div className="admin-modal-meta">
                <strong>From:</strong> {email.from}
              </div>
              <div className="admin-modal-meta">
                <strong>To:</strong> {Array.isArray(email.to) ? email.to.join(', ') : email.to}
              </div>
              <div className="admin-modal-meta">
                <strong>Subject:</strong> {email.subject}
              </div>
              <div className="admin-modal-meta">
                <strong>Date:</strong> {fullDate(email.created_at)}
              </div>
              {email.last_event !== undefined && (
                <div className="admin-modal-meta">
                  <strong>Status:</strong>{' '}
                  <span
                    className={`admin-email-status admin-email-status-${(email.last_event || 'queued').toLowerCase()}`}
                  >
                    {email.last_event || 'queued'}
                  </span>
                </div>
              )}
              {email.attachments && email.attachments.length > 0 && (
                <div className="admin-modal-meta">
                  <strong>Files:</strong>{' '}
                  <span className="admin-attachment-list">
                    {email.attachments.map((a, i) => (
                      <span key={i} className="admin-attachment-chip">
                        {a.filename}
                        {a.size != null && (
                          <span className="admin-attachment-size"> ({Math.round(a.size / 1024)}KB)</span>
                        )}
                      </span>
                    ))}
                  </span>
                </div>
              )}
              <div className="admin-modal-actions">
                {onReply && (
                  <button
                    className="admin-compose-btn"
                    onClick={() => {
                      onReply(email);
                      onClose();
                    }}
                  >
                    Reply
                  </button>
                )}
                {onForward && (
                  <button
                    className="admin-refresh-btn"
                    onClick={() => {
                      onForward(email);
                      onClose();
                    }}
                  >
                    Forward
                  </button>
                )}
              </div>
            </div>
            <div className="admin-modal-body">
              {email.html ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={injectBaseTarget(email.html)}
                  title="Email preview"
                  className="admin-modal-iframe"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  onLoad={handleIframeLoad}
                />
              ) : (
                <pre className="admin-modal-text">{email.text || '(no content)'}</pre>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
