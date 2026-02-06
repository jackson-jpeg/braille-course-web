'use client';

import { useState } from 'react';
import { useToast } from './AdminToast';
import type { Material } from './admin-types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FORMAT_OPTIONS = [
  {
    value: 'pptx',
    label: 'PowerPoint',
    description: 'Slide deck with title, bullets, and speaker notes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 7h8M8 11h5M8 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: 'pdf',
    label: 'PDF Handout',
    description: 'Formatted document with sections and bullet points',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M6 2h8l6 6v14H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: 'study-guide',
    label: 'Study Guide',
    description: 'Objectives, key terms, and practice questions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 7h8M8 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

interface Props {
  onEmailMaterial: (materialId: string) => void;
}

export default function AdminCreateTab({ onEmailMaterial }: Props) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [format, setFormat] = useState('pptx');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Material | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: notes, format, title, instructions: instructions || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate');
      setResult(json.material);
      setRecentMaterials((prev) => [json.material, ...prev]);
      showToast(`Generated "${json.material.filename}"`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate', 'error');
    } finally {
      setGenerating(false);
    }
  }

  function handleGenerateAnother() {
    setResult(null);
    setTitle('');
    setNotes('');
    setInstructions('');
  }

  return (
    <div className="admin-create-tab">
      {!result ? (
        <form onSubmit={handleGenerate} className="admin-create-form">
          <div className="admin-create-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L9 9l-7 1 5 5-1.5 7L12 18l6.5 4L17 15l5-5-7-1-3-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <div>
              <h3>AI Material Generator</h3>
              <p>Paste your notes or lesson plans and let AI create polished teaching materials.</p>
            </div>
          </div>

          <div className="admin-compose-field">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Grade 2 Braille"
              className="admin-compose-input"
              required
            />
          </div>

          <div className="admin-compose-field">
            <label>Notes / Lesson Plan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste your notes, lesson outline, or key topics here. The more detail you provide, the better the output..."
              className="admin-compose-textarea"
              rows={10}
              required
            />
          </div>

          <div className="admin-compose-field">
            <label>Output Format</label>
            <div className="admin-create-format-options">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`admin-create-format-btn ${format === opt.value ? 'admin-create-format-btn-active' : ''}`}
                  onClick={() => setFormat(opt.value)}
                >
                  <span className="admin-create-format-icon">{opt.icon}</span>
                  <span className="admin-create-format-label">{opt.label}</span>
                  <span className="admin-create-format-desc">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-compose-field">
            <label>Additional Instructions <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Focus on contractions, include examples for each rule"
              className="admin-compose-input"
            />
          </div>

          <div className="admin-compose-actions">
            <button type="submit" className="admin-send-btn" disabled={generating}>
              {generating ? (
                <>
                  <span className="admin-create-spinner" />
                  Generating&hellip;
                </>
              ) : (
                'Generate Material'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-create-result">
          <div className="admin-create-result-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Material Generated</h3>
          </div>

          <div className="admin-create-result-card">
            <div className="admin-create-result-info">
              <span className="admin-create-result-filename">{result.filename}</span>
              <span className="admin-category-badge">{result.category}</span>
              <span className="admin-create-result-size">{formatFileSize(result.size)}</span>
            </div>
            <div className="admin-create-result-actions">
              <a
                href={result.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-compose-btn"
              >
                Download
              </a>
              <button
                className="admin-send-btn"
                onClick={() => onEmailMaterial(result.id)}
              >
                Email to Students
              </button>
              <button
                className="admin-refresh-btn"
                onClick={handleGenerateAnother}
              >
                Generate Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recently generated materials */}
      {recentMaterials.length > 0 && (
        <div className="admin-create-recent">
          <h4>Recently Generated</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentMaterials.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <a href={m.blobUrl} target="_blank" rel="noopener noreferrer" className="admin-stripe-link">
                        {m.filename}
                      </a>
                    </td>
                    <td><span className="admin-category-badge">{m.category}</span></td>
                    <td>{formatFileSize(m.size)}</td>
                    <td>
                      <button
                        className="admin-compose-btn"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => onEmailMaterial(m.id)}
                      >
                        Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
