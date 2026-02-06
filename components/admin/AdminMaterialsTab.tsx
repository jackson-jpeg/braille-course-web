'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AdminConfirmDialog from './AdminConfirmDialog';
import { useToast } from './AdminToast';
import { SkeletonTable } from './AdminSkeleton';
import type { Material } from './admin-types';

const CATEGORIES = ['All', 'Lesson Plans', 'Handouts', 'Presentations', 'Study Guides', 'Worksheets', 'Other', 'Uncategorized'] as const;

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
  const [dragOver, setDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [uploadCategory, setUploadCategory] = useState<string>('Uncategorized');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

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

  const doUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);

      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload');
      setMaterials((prev) => [json.material, ...prev]);
      showToast(`Uploaded "${file.name}"`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload file';
      showToast(msg, 'error');
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [showToast, uploadCategory]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
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
      showToast(`Deleted "${deletingMaterial.filename}"`);
      setDeletingMaterial(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete material', 'error');
      setDeletingMaterial(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const filteredMaterials = selectedCategory === 'All'
    ? materials
    : materials.filter((m) => m.category === selectedCategory);

  return (
    <>
      {/* Upload zone with category selector */}
      <div className="admin-materials-upload-row">
        <div
          className={`admin-drop-zone ${dragOver ? 'admin-drop-zone-active' : ''} ${uploading ? 'admin-drop-zone-uploading' : ''}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{ flex: 1 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <svg className="admin-drop-zone-icon" width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="admin-drop-zone-text">
            {uploading ? 'Uploading\u2026' : 'Drop files here or click to upload'}
          </p>
        </div>
        <div className="admin-upload-category-select">
          <label>Category</label>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="admin-select"
          >
            {CATEGORIES.filter((c) => c !== 'All').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category filter bar */}
      <div className="admin-category-filter">
        {CATEGORIES.map((cat) => {
          const count = cat === 'All' ? materials.length : materials.filter((m) => m.category === cat).length;
          if (cat !== 'All' && count === 0) return null;
          return (
            <button
              key={cat}
              className={`admin-category-pill ${selectedCategory === cat ? 'admin-category-pill-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
              <span className="admin-category-pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="admin-payments-toolbar" style={{ marginTop: 8 }}>
        <button className="admin-refresh-btn" onClick={fetchMaterials} disabled={loading}>
          {loading ? 'Loading\u2026' : 'Refresh'}
        </button>
        <span className="admin-result-count" style={{ marginLeft: 'auto' }}>
          {filteredMaterials.length} file{filteredMaterials.length !== 1 ? 's' : ''}
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </span>
      </div>

      {error && <div className="admin-email-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Category</th>
              <th>Type</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && materials.length === 0 ? (
              <tr><td colSpan={6} className="admin-empty"><SkeletonTable rows={3} cols={6} /></td></tr>
            ) : filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  <div className="admin-empty-state">
                    <p className="admin-empty-state-title">
                      {selectedCategory === 'All' ? 'No materials uploaded yet' : `No materials in "${selectedCategory}"`}
                    </p>
                    <p className="admin-empty-state-sub">Upload class handouts, worksheets, or other files for your students.</p>
                    <button className="admin-empty-state-cta" onClick={() => fileInputRef.current?.click()}>Upload a File</button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMaterials.map((m) => (
                <tr key={m.id}>
                  <td>
                    <a href={m.blobUrl} target="_blank" rel="noopener noreferrer" className="admin-stripe-link">
                      {m.filename}
                    </a>
                  </td>
                  <td>
                    <span className="admin-category-badge">{m.category}</span>
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
