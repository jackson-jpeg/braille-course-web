'use client';

import { useState, useRef } from 'react';
import { useToast } from './AdminToast';
import type { Material, GeneratePreview } from './admin-types';

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
  {
    value: 'worksheet',
    label: 'Worksheet',
    description: 'Fill-in-the-blank, matching, and practice drills',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 8h3M7 12h5M7 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M15 8h2M15 12h2M15 16h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: 'quiz',
    label: 'Quiz',
    description: 'Multiple choice, true/false, and short answer assessment',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 9.5a3 3 0 015.12 1.5c0 1.5-2.12 2-2.12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
      </svg>
    ),
  },
];

const TEMPLATE_PRESETS = [
  {
    label: 'Grade 1 Introduction',
    title: 'Introduction to Grade 1 Braille',
    notes: 'Cover the braille alphabet (a-z), numbers (using number indicator #), and basic punctuation (period, comma, question mark, exclamation mark). Include how each letter maps to a braille cell configuration. Explain the 6-dot cell layout (dots 1-6). Provide examples of simple words spelled out letter by letter.',
  },
  {
    label: 'Contractions Practice',
    title: 'Grade 2 Braille Contractions',
    notes: 'Focus on the most common Grade 2 braille contractions: "and", "for", "of", "the", "with", "ch", "sh", "th", "wh", "ed", "er", "ou", "ow", "st", "ing". Include whole-word contractions like "but", "can", "do", "every", "from", "go", "have", "just", "knowledge", "like", "more", "not". Provide exercises pairing print text with contracted braille representations.',
  },
  {
    label: 'Number Signs',
    title: 'Numbers and Math in Braille',
    notes: 'Explain the number indicator (dots 3-4-5-6) and how letters a-j become numbers 1-0. Cover the Nemeth code basics for math: plus, minus, multiplication, division, equals sign. Include real-world examples: phone numbers, addresses, prices, dates. Practice reading and writing multi-digit numbers.',
  },
  {
    label: 'Formatting Indicators',
    title: 'Braille Formatting Indicators',
    notes: 'Cover capital letter indicator (dot 6), double capital for all-caps (dot 6, dot 6), letter indicator (dots 5-6), italic indicator (dots 4-6), bold indicator (dots 4-5-6), and termination indicator. Explain when and how each is used. Include examples of proper nouns, acronyms, and emphasized text in braille.',
  },
];

type GenStage = 'idle' | 'ai' | 'building' | 'uploading' | 'done';

interface Props {
  onEmailMaterial: (materialId: string) => void;
}

export default function AdminCreateTab({ onEmailMaterial }: Props) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [format, setFormat] = useState('pptx');
  const [instructions, setInstructions] = useState('');
  const [genStage, setGenStage] = useState<GenStage>('idle');
  const [genError, setGenError] = useState('');
  const [result, setResult] = useState<Material | null>(null);
  const [preview, setPreview] = useState<GeneratePreview | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenStage('ai');
    setGenError('');
    setResult(null);
    setPreview(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: notes, format, title, instructions: instructions || undefined }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Non-SSE error (400, 401, etc.)
        const json = await res.json();
        throw new Error(json.error || 'Failed to generate');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const event = JSON.parse(jsonStr);

            if (event.error) {
              throw new Error(event.error);
            }

            if (event.stage === 'ai') setGenStage('ai');
            else if (event.stage === 'building') setGenStage('building');
            else if (event.stage === 'uploading') setGenStage('uploading');
            else if (event.stage === 'done') {
              setGenStage('done');
              setResult(event.material);
              setPreview(event.preview || null);
              setRecentMaterials((prev) => [event.material, ...prev]);
              showToast(`Generated "${event.material.filename}"`);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== jsonStr) {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Failed to generate';
      setGenError(message);
      setGenStage('idle');
      showToast(message, 'error');
    }
  }

  function handleRegenerate() {
    setResult(null);
    setPreview(null);
    setGenStage('idle');
    setGenError('');
    // Keep title, notes, format, instructions for tweaking
  }

  function handleStartFresh() {
    setResult(null);
    setPreview(null);
    setGenStage('idle');
    setGenError('');
    setTitle('');
    setNotes('');
    setInstructions('');
  }

  function applyPreset(preset: typeof TEMPLATE_PRESETS[number]) {
    setTitle(preset.title);
    setNotes(preset.notes);
  }

  const isGenerating = genStage !== 'idle' && genStage !== 'done';
  const showForm = genStage === 'idle' || isGenerating;
  const showResult = genStage === 'done' && result;

  const STEPS: { key: GenStage; label: string }[] = [
    { key: 'ai', label: 'Generating content' },
    { key: 'building', label: 'Building document' },
    { key: 'uploading', label: 'Uploading file' },
  ];

  const stageOrder: GenStage[] = ['ai', 'building', 'uploading', 'done'];
  const currentIndex = stageOrder.indexOf(genStage);

  function renderProgressStepper() {
    if (!isGenerating) return null;
    return (
      <div className="admin-gen-stepper">
        {STEPS.map((step, i) => {
          const stepIndex = stageOrder.indexOf(step.key);
          const isActive = genStage === step.key;
          const isComplete = currentIndex > stepIndex;
          return (
            <div key={step.key} className="admin-gen-step-wrap">
              {i > 0 && (
                <div className={`admin-gen-step-line ${isComplete || isActive ? 'admin-gen-step-line-active' : ''}`} />
              )}
              <div className={`admin-gen-step-dot ${isActive ? 'admin-gen-step-dot-active' : ''} ${isComplete ? 'admin-gen-step-dot-done' : ''}`}>
                {isComplete ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isActive ? (
                  <span className="admin-gen-step-spinner" />
                ) : null}
              </div>
              <span className={`admin-gen-step-label ${isActive ? 'admin-gen-step-label-active' : ''} ${isComplete ? 'admin-gen-step-label-done' : ''}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  function renderPreview() {
    if (!preview) return null;
    return (
      <div className="admin-gen-preview">
        <h4>Content Summary</h4>
        {preview.slideTitles && (
          <div className="admin-gen-preview-list">
            <span className="admin-gen-preview-label">{preview.slideTitles.length} slides:</span>
            <ul>
              {preview.slideTitles.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}
        {preview.objectives && preview.objectives.length > 0 && (
          <div className="admin-gen-preview-list">
            <span className="admin-gen-preview-label">Objectives:</span>
            <ul>
              {preview.objectives.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </div>
        )}
        {preview.sectionHeadings && (
          <div className="admin-gen-preview-list">
            <span className="admin-gen-preview-label">{preview.sectionHeadings.length} sections:</span>
            <ul>
              {preview.sectionHeadings.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>
        )}
        {preview.questionCounts && (
          <div className="admin-gen-preview-list">
            <span className="admin-gen-preview-label">{preview.totalQuestions} questions:</span>
            <ul>
              {preview.questionCounts['multiple-choice'] > 0 && <li>{preview.questionCounts['multiple-choice']} multiple choice</li>}
              {preview.questionCounts['true-false'] > 0 && <li>{preview.questionCounts['true-false']} true/false</li>}
              {preview.questionCounts['short-answer'] > 0 && <li>{preview.questionCounts['short-answer']} short answer</li>}
            </ul>
          </div>
        )}
        {preview.worksheetSections && (
          <div className="admin-gen-preview-list">
            <span className="admin-gen-preview-label">{preview.totalItems} items across {preview.worksheetSections.length} sections:</span>
            <ul>
              {preview.worksheetSections.map((s, i) => (
                <li key={i}>{s.heading} ({s.type}, {s.itemCount} items)</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-create-tab">
      {showForm && (
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
              disabled={isGenerating}
            />
          </div>

          <div className="admin-compose-field">
            <label>Notes / Lesson Plan</label>
            <div className="admin-gen-presets">
              {TEMPLATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="admin-gen-preset-btn"
                  onClick={() => applyPreset(preset)}
                  disabled={isGenerating}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste your notes, lesson outline, or key topics here. The more detail you provide, the better the output..."
              className="admin-compose-textarea"
              rows={10}
              required
              disabled={isGenerating}
            />
            <div className="admin-gen-charcount">{notes.length} characters</div>
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
                  disabled={isGenerating}
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
              disabled={isGenerating}
            />
          </div>

          {renderProgressStepper()}

          {genError && (
            <div className="admin-compose-error" style={{ marginBottom: 8 }}>{genError}</div>
          )}

          <div className="admin-compose-actions">
            <button type="submit" className="admin-send-btn" disabled={isGenerating}>
              {isGenerating ? (
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
      )}

      {showResult && (
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
                onClick={handleRegenerate}
              >
                Regenerate
              </button>
              <button
                className="admin-compose-btn"
                onClick={handleStartFresh}
              >
                Start Fresh
              </button>
            </div>
          </div>

          {renderPreview()}
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
