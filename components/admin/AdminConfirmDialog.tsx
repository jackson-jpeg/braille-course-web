'use client';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function AdminConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading,
}: Props) {
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onCancel}>&times;</button>
        <h3 className="admin-confirm-title">{title}</h3>
        <p className="admin-confirm-message">{message}</p>
        <div className="admin-confirm-actions">
          <button className="admin-refresh-btn" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={confirmVariant === 'danger' ? 'admin-refund-confirm' : 'admin-compose-btn'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing\u2026' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
