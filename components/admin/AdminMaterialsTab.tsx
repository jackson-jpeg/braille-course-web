'use client';

import { useState, useEffect, useRef } from 'react';
import AdminConfirmDialog from './AdminConfirmDialog';
import type { Material } from './admin-types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  onEmailMaterial: (materialId: string) => void;
}

export default function AdminMaterialsTab({ onEmailMaterial }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/materials');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setMaterials(json.materials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload');
      setMaterials((prev) => [json.material, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete() {
    if (!deletingMaterial) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/materials/${deletingMaterial.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete');
      }
      setMaterials((prev) => prev.filter((m) => m.id !== deletingMaterial.id));
      setDeletingMaterial(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete material');
      setDeletingMaterial(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="admin-payments-toolbar">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <button
          className="admin-compose-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading\u2026' : 'Upload File'}
        </button>
        <button className="admin-refresh-btn" onClick={fetchMaterials} disabled={loading}>
          {loading ? 'Loading\u2026' : 'Refresh'}
        </button>
      </div>

      {error && <div className="admin-email-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Type</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && materials.length === 0 ? (
              <tr><td colSpan={5} className="admin-empty">Loading materials&hellip;</td></tr>
            ) : materials.length === 0 ? (
              <tr><td colSpan={5} className="admin-empty">No materials uploaded yet.</td></tr>
            ) : (
              materials.map((m) => (
                <tr key={m.id}>
                  <td>
                    <a href={m.blobUrl} target="_blank" rel="noopener noreferrer" className="admin-stripe-link">
                      {m.filename}
                    </a>
                  </td>
                  <td>{m.contentType}</td>
                  <td>{formatFileSize(m.size)}</td>
                  <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-payment-actions">
                      <button
                        className="admin-compose-btn"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => onEmailMaterial(m.id)}
                      >
                        Email
                      </button>
                      <button
                        className="admin-refund-confirm"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => setDeletingMaterial(m)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deletingMaterial && (
        <AdminConfirmDialog
          title="Delete Material"
          message={`Delete "${deletingMaterial.filename}"? This will remove the file permanently.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeletingMaterial(null)}
        />
      )}
    </>
  );
}
