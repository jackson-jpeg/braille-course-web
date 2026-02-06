'use client';

import type { EmailDetail } from './admin-types';
import { fullDate } from './admin-utils';

interface Props {
  email: EmailDetail | null;
  loading: boolean;
  onClose: () => void;
  onReply?: (email: EmailDetail) => void;
  onForward?: (email: EmailDetail) => void;
}

export default function AdminEmailModal({ email, loading, onClose, onReply, onForward }: Props) {
  if (!email && !loading) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
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
                  <span className={`admin-email-status admin-email-status-${(email.last_event || 'queued').toLowerCase()}`}>
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
                    onClick={() => { onReply(email); onClose(); }}
                  >
                    Reply
                  </button>
                )}
                {onForward && (
                  <button
                    className="admin-refresh-btn"
                    onClick={() => { onForward(email); onClose(); }}
                  >
                    Forward
                  </button>
                )}
              </div>
            </div>
            <div className="admin-modal-body">
              {email.html ? (
                <iframe
                  srcDoc={email.html}
                  title="Email preview"
                  className="admin-modal-iframe"
                  sandbox=""
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
