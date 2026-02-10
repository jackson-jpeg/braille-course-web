'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from './AdminToast';
import { formatFileSize } from './admin-utils';
import AdminConfirmDialog from './AdminConfirmDialog';
import ContentReviewEditor from './ContentReviewEditor';
import type { Material, GeneratePreview, ContentTemplate, CorrectionEntry } from './admin-types';

const FORMAT_OPTIONS = [
  {
    value: 'pptx',
    label: 'PowerPoint',
    description: 'Slide deck with title, bullets, and speaker notes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7h8M8 11h5M8 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'pdf',
    label: 'PDF Handout',
    description: 'Formatted document with sections and bullet points',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M6 2h8l6 6v14H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'study-guide',
    label: 'Study Guide',
    description: 'Objectives, key terms, and practice questions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 19.5A2.5 2.5 0 016.5 17H20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7h8M8 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'worksheet',
    label: 'Worksheet',
    description: 'Fill-in-the-blank, matching, and practice drills',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 8h3M7 12h5M7 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 8h2M15 12h2M15 16h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'quiz',
    label: 'Quiz',
    description: 'Multiple choice, true/false, and short answer assessment',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M9 9.5a3 3 0 015.12 1.5c0 1.5-2.12 2-2.12 2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    ),
  },
  {
    value: 'session-bundle',
    label: 'Session Bundle',
    description: 'Slides + handout + worksheet — complete session package',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="4" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8" y="13" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const BUILTIN_PRESETS = [
  {
    label: 'Grade 1 Introduction',
    title: 'Introduction to Grade 1 Braille',
    notes:
      'Cover the braille alphabet (a-z), numbers (using number indicator #), and basic punctuation (period, comma, question mark, exclamation mark). Include how each letter maps to a braille cell configuration. Explain the 6-dot cell layout (dots 1-6). Provide examples of simple words spelled out letter by letter.',
  },
  {
    label: 'Contractions Practice',
    title: 'Grade 2 Braille Contractions',
    notes:
      'Focus on the most common Grade 2 braille contractions: "and", "for", "of", "the", "with", "ch", "sh", "th", "wh", "ed", "er", "ou", "ow", "st", "ing". Include whole-word contractions like "but", "can", "do", "every", "from", "go", "have", "just", "knowledge", "like", "more", "not". Provide exercises pairing print text with contracted braille representations.',
  },
  {
    label: 'Number Signs',
    title: 'Numbers and Math in Braille',
    notes:
      'Explain the number indicator (dots 3-4-5-6) and how letters a-j become numbers 1-0. Cover the Nemeth code basics for math: plus, minus, multiplication, division, equals sign. Include real-world examples: phone numbers, addresses, prices, dates. Practice reading and writing multi-digit numbers.',
  },
  {
    label: 'Formatting Indicators',
    title: 'Braille Formatting Indicators',
    notes:
      'Cover capital letter indicator (dot 6), double capital for all-caps (dot 6, dot 6), letter indicator (dots 5-6), italic indicator (dots 4-6), bold indicator (dots 4-5-6), and termination indicator. Explain when and how each is used. Include examples of proper nouns, acronyms, and emphasized text in braille.',
  },
];

type GenStage = 'idle' | 'ai' | 'review' | 'building' | 'uploading' | 'done';

interface Props {
  onEmailMaterial: (materialId: string) => void;
}

export default function AdminCreateTab({ onEmailMaterial }: Props) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [format, setFormat] = useState('pptx');
  const [instructions, setInstructions] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [genStage, setGenStage] = useState<GenStage>('idle');
  const [genError, setGenError] = useState('');
  const [result, setResult] = useState<Material | null>(null);
  const [preview, setPreview] = useState<GeneratePreview | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Review stage state
  const [contentJson, setContentJson] = useState<unknown>(null);
  const [corrections, setCorrections] = useState<CorrectionEntry[]>([]);
  const [wasCorrected, setWasCorrected] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [bundleResults, setBundleResults] = useState<Material[]>([]);
  const [draftSaveStatus, setDraftSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Polish notes
  const [polishing, setPolishing] = useState(false);

  // DB-backed templates
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const skipDupeCheckRef = useRef(false);

  // Quick-generate
  const [nextSession, setNextSession] = useState<{ title: string; date: string } | null>(null);

  // Autosave draft debounce ref
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch persistent recent materials
  const fetchRecentMaterials = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/materials');
      if (res.ok) {
        const data = await res.json();
        setRecentMaterials((data.materials || []).slice(0, 10));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch saved templates
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch next upcoming session for quick-generate
  const fetchNextSession = useCallback(async () => {
    try {
      const secRes = await fetch('/api/sections');
      if (!secRes.ok) return;
      const sections = await secRes.json();
      if (!Array.isArray(sections) || sections.length === 0) return;

      const sessRes = await fetch(`/api/admin/sessions?sectionId=${sections[0].id}`);
      if (!sessRes.ok) return;
      const sessData = await sessRes.json();
      const sessions = sessData.sessions || [];

      const now = new Date();
      const upcoming = sessions
        .filter((s: { date: string }) => new Date(s.date) > now)
        .sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (upcoming.length > 0) {
        setNextSession({
          title: upcoming[0].title,
          date: new Date(upcoming[0].date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchRecentMaterials();
    fetchTemplates();
    fetchNextSession();
  }, [fetchRecentMaterials, fetchTemplates, fetchNextSession]);

  // Abort in-flight generation on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  // Autosave draft when in review stage
  const saveDraft = useCallback(
    async (json: unknown) => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(async () => {
        setDraftSaveStatus('saving');
        try {
          const res = await fetch('/api/admin/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: draftId || undefined,
              title,
              notes,
              format,
              difficulty,
              instructions: instructions || undefined,
              contentJson: json,
              wasCorrected,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (!draftId) setDraftId(data.draft.id);
            setDraftSaveStatus('saved');
          }
        } catch {
          /* ignore */
        }
      }, 3000);
    },
    [draftId, title, notes, format, difficulty, instructions, wasCorrected],
  );

  async function checkDuplicate(): Promise<boolean> {
    if (!title.trim()) return false;
    try {
      const res = await fetch('/api/admin/materials');
      if (!res.ok) return false;
      const data = await res.json();
      const materials = data.materials || [];
      const safeTitle = title
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      const match = materials.find((m: Material) => m.filename.toLowerCase().includes(safeTitle));
      if (match) {
        setDuplicateWarning(match.filename);
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  async function handlePolishNotes() {
    if (notes.length < 20) return;
    setPolishing(true);
    try {
      const res = await fetch('/api/admin/polish-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, format, difficulty }),
      });
      if (!res.ok) throw new Error('Failed to polish notes');
      const data = await res.json();
      setNotes(data.polished);
      showToast('Notes polished');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to polish notes', 'error');
    }
    setPolishing(false);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    // Check for duplicates first (skipped if user already confirmed)
    if (!skipDupeCheckRef.current) {
      const hasDupe = await checkDuplicate();
      if (hasDupe) {
        setShowDuplicateConfirm(true);
        return;
      }
    }
    skipDupeCheckRef.current = false;

    setShowDuplicateConfirm(false);
    setDuplicateWarning(null);
    setGenStage('ai');
    setGenError('');
    setResult(null);
    setPreview(null);
    setContentJson(null);
    setCorrections([]);
    setWasCorrected(false);
    setDraftId(null);
    setBundleResults([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: notes, format, title, instructions: instructions || undefined, difficulty }),
        signal: controller.signal,
      });

      if (!res.ok) {
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

            if (event.stage === 'ai') {
              setGenStage('ai');
            } else if (event.stage === 'review') {
              // Two-stage flow: stop at review
              setGenStage('review');
              setContentJson(event.content);
              setPreview(event.preview || null);
              setCorrections(event.corrections || []);
              setWasCorrected(event.wasCorrected || false);
              showToast('Content ready for review');
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

  async function handleBuildFromReview(editedJson: unknown) {
    setGenStage('building');
    setGenError('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/admin/build-from-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentJson: typeof editedJson === 'string' ? editedJson : JSON.stringify(editedJson),
          format,
          title,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to build');
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

            if (event.stage === 'building') setGenStage('building');
            else if (event.stage === 'uploading') setGenStage('uploading');
            else if (event.stage === 'done') {
              setGenStage('done');
              if (event.materials) {
                // Session bundle — multiple materials
                setBundleResults(event.materials);
                setRecentMaterials((prev) => [...event.materials, ...prev.slice(0, 7)]);
                showToast(`Built ${event.materials.length} documents`);
              } else if (event.material) {
                setResult(event.material);
                setRecentMaterials((prev) => [event.material, ...prev.slice(0, 9)]);
                showToast(`Generated "${event.material.filename}"`);
              }
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
      const message = err instanceof Error ? err.message : 'Failed to build document';
      setGenError(message);
      setGenStage('review');
      showToast(message, 'error');
    }
  }

  function handleRegenerate() {
    setResult(null);
    setPreview(null);
    setContentJson(null);
    setCorrections([]);
    setWasCorrected(false);
    setBundleResults([]);
    setGenStage('idle');
    setGenError('');
  }

  function handleStartFresh() {
    setResult(null);
    setPreview(null);
    setContentJson(null);
    setCorrections([]);
    setWasCorrected(false);
    setBundleResults([]);
    setDraftId(null);
    setGenStage('idle');
    setGenError('');
    setTitle('');
    setNotes('');
    setInstructions('');
    setDifficulty('intermediate');
  }

  function handleBackToForm() {
    setContentJson(null);
    setCorrections([]);
    setWasCorrected(false);
    setGenStage('idle');
    setGenError('');
  }

  function applyPreset(preset: { title: string; notes: string }) {
    setTitle(preset.title);
    setNotes(preset.notes);
  }

  function applyTemplate(tmpl: ContentTemplate) {
    setTitle(tmpl.title);
    setNotes(tmpl.notes);
    setFormat(tmpl.format);
    setDifficulty(tmpl.difficulty as 'beginner' | 'intermediate' | 'advanced');
    if (tmpl.instructions) setInstructions(tmpl.instructions);
  }

  async function handleSaveTemplate() {
    if (!title.trim() || !notes.trim()) {
      showToast('Fill in title and notes before saving a template', 'error');
      return;
    }
    setSavingTemplate(true);
    try {
      const label = title.length > 30 ? title.slice(0, 27) + '...' : title;
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, title, notes, format, difficulty, instructions: instructions || undefined }),
      });
      if (!res.ok) throw new Error('Failed to save template');
      const data = await res.json();
      setTemplates((prev) => [data.template, ...prev]);
      showToast('Template saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save template', 'error');
    }
    setSavingTemplate(false);
  }

  async function handleDeleteTemplate(id: string) {
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showToast('Template deleted');
    } catch {
      showToast('Failed to delete template', 'error');
    }
  }

  async function handleDeleteMaterial(id: string) {
    try {
      const res = await fetch(`/api/admin/materials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setRecentMaterials((prev) => prev.filter((m) => m.id !== id));
      showToast('Material deleted');
    } catch {
      showToast('Failed to delete material', 'error');
    }
  }

  function handleQuickGenerate(type: 'worksheet' | 'quiz' | 'study-guide') {
    const sessionCtx = nextSession ? ` (${nextSession.title}, ${nextSession.date})` : '';
    const labels: Record<string, { title: string; notes: string }> = {
      worksheet: {
        title: `Worksheet${sessionCtx}`,
        notes: `Create a practice worksheet for the next class session${sessionCtx}. Include fill-in-the-blank, matching, and braille-to-print exercises covering recently taught material.`,
      },
      quiz: {
        title: `Quiz${sessionCtx}`,
        notes: `Create a quiz for the next class session${sessionCtx}. Include a mix of multiple-choice, true/false, and short-answer questions to assess understanding of recent lessons.`,
      },
      'study-guide': {
        title: `Study Guide${sessionCtx}`,
        notes: `Create a study guide for this week's material${sessionCtx}. Include learning objectives, key terms with dot patterns, and practice questions.`,
      },
    };

    const preset = labels[type];
    setTitle(preset.title);
    setNotes(preset.notes);
    setFormat(type);
    setDifficulty('intermediate');
    setInstructions('');
  }

  const isGenerating = genStage === 'ai';
  const isBuilding = genStage === 'building' || genStage === 'uploading';
  const showForm = genStage === 'idle' || genStage === 'ai';
  const showReview = genStage === 'review';
  const showResult = genStage === 'done' && (result || bundleResults.length > 0);

  const STEPS: { key: GenStage; label: string }[] = [
    { key: 'ai', label: 'Generating content' },
    { key: 'review', label: 'Review & Edit' },
    { key: 'building', label: 'Building document' },
    { key: 'uploading', label: 'Uploading file' },
  ];

  const stageOrder: GenStage[] = ['ai', 'review', 'building', 'uploading', 'done'];
  const currentIndex = stageOrder.indexOf(genStage);

  function renderProgressStepper() {
    if (genStage === 'idle' || genStage === 'done') return null;
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
              <div
                className={`admin-gen-step-dot ${isActive ? 'admin-gen-step-dot-active' : ''} ${isComplete ? 'admin-gen-step-dot-done' : ''}`}
              >
                {isComplete ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : isActive ? (
                  step.key === 'review' ? null : (
                    <span className="admin-gen-step-spinner" />
                  )
                ) : null}
              </div>
              <span
                className={`admin-gen-step-label ${isActive ? 'admin-gen-step-label-active' : ''} ${isComplete ? 'admin-gen-step-label-done' : ''}`}
              >
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
              {preview.slideTitles.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {preview.objectives && preview.objectives.length > 0 && (
          <div className="admin-gen-preview-list">
            <span className="admin-gen-preview-label">Objectives:</span>
            <ul>
              {preview.objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}
        {preview.sectionHeadings && (
          <div className="admin-gen-preview-list">
            <span className="admin-gen-preview-label">{preview.sectionHeadings.length} sections:</span>
            <ul>
              {preview.sectionHeadings.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
        {preview.questionCounts && (
          <div className="admin-gen-preview-list">
            <span className="admin-gen-preview-label">{preview.totalQuestions} questions:</span>
            <ul>
              {preview.questionCounts['multiple-choice'] > 0 && (
                <li>{preview.questionCounts['multiple-choice']} multiple choice</li>
              )}
              {preview.questionCounts['true-false'] > 0 && <li>{preview.questionCounts['true-false']} true/false</li>}
              {preview.questionCounts['short-answer'] > 0 && (
                <li>{preview.questionCounts['short-answer']} short answer</li>
              )}
            </ul>
          </div>
        )}
        {preview.worksheetSections && (
          <div className="admin-gen-preview-list">
            <span className="admin-gen-preview-label">
              {preview.totalItems} items across {preview.worksheetSections.length} sections:
            </span>
            <ul>
              {preview.worksheetSections.map((s, i) => (
                <li key={i}>
                  {s.heading} ({s.type}, {s.itemCount} items)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  function renderResultCard(m: Material) {
    return (
      <div key={m.id} className="admin-create-result-card">
        <div className="admin-create-result-info">
          <span className="admin-create-result-filename">{m.filename}</span>
          <span className="admin-category-badge">{m.category}</span>
          <span className="admin-create-result-size">{formatFileSize(m.size)}</span>
        </div>
        <div className="admin-create-result-actions">
          <a href={m.blobUrl} target="_blank" rel="noopener noreferrer" className="admin-compose-btn">
            Download
          </a>
          <button className="admin-send-btn" onClick={() => onEmailMaterial(m.id)}>
            Email to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-create-tab">
      {showForm && (
        <form ref={formRef} onSubmit={handleGenerate} className="admin-create-form">
          <div className="admin-create-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L9 9l-7 1 5 5-1.5 7L12 18l6.5 4L17 15l5-5-7-1-3-7z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
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
              {/* Saved templates */}
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="admin-template-chip"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isGenerating) applyTemplate(tmpl);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isGenerating) applyTemplate(tmpl);
                  }}
                >
                  {tmpl.label}
                  <button
                    type="button"
                    className="admin-template-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(tmpl.id);
                    }}
                    title="Delete template"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {/* Built-in presets */}
              {BUILTIN_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="admin-gen-preset-btn"
                  onClick={() => applyPreset(preset)}
                  disabled={isGenerating}
                  style={{ borderStyle: 'dashed' }}
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
            <div className="admin-gen-charcount">
              {notes.length} characters
              {notes.length > 20 && !isGenerating && (
                <button
                  type="button"
                  className="admin-compose-btn"
                  style={{ fontSize: '0.72rem', padding: '2px 8px', marginLeft: 8 }}
                  onClick={handlePolishNotes}
                  disabled={polishing}
                >
                  {polishing ? (
                    <>
                      <span className="admin-create-spinner" style={{ width: 10, height: 10, marginRight: 4 }} />
                      Polishing&hellip;
                    </>
                  ) : (
                    'Polish Notes'
                  )}
                </button>
              )}
              {title.trim() && notes.trim() && !isGenerating && (
                <button
                  type="button"
                  className="admin-compose-btn"
                  style={{ fontSize: '0.72rem', padding: '2px 8px', marginLeft: 8 }}
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                >
                  {savingTemplate ? 'Saving\u2026' : 'Save as Template'}
                </button>
              )}
            </div>
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
            <label>Difficulty / Grade Level</label>
            <div className="admin-difficulty-picker">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`admin-difficulty-btn ${difficulty === level ? 'admin-difficulty-btn-active' : ''}`}
                  onClick={() => setDifficulty(level)}
                  disabled={isGenerating}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <span className="admin-difficulty-hint">
              {difficulty === 'beginner' && 'Grade 1 only — dot numbers, simple words, 3-5 new characters per section'}
              {difficulty === 'intermediate' && 'Grade 1 + common Grade 2 contractions, 5-8 concepts per section'}
              {difficulty === 'advanced' &&
                'Grade 2 emphasis — context rules, exceptions, full sentences, 8-12 concepts per section'}
            </span>
          </div>

          <div className="admin-compose-field">
            <label>
              Additional Instructions <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
            </label>
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
            <div className="admin-compose-error" style={{ marginBottom: 8 }}>
              {genError}
            </div>
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

      {/* Duplicate warning dialog */}
      {showDuplicateConfirm && duplicateWarning && (
        <AdminConfirmDialog
          title="Duplicate Material"
          message={`A material named "${duplicateWarning}" already exists. Generate anyway?`}
          confirmLabel="Generate Anyway"
          confirmVariant="primary"
          onConfirm={() => {
            skipDupeCheckRef.current = true;
            setShowDuplicateConfirm(false);
            setDuplicateWarning(null);
            formRef.current?.requestSubmit();
          }}
          onCancel={() => {
            setShowDuplicateConfirm(false);
            setDuplicateWarning(null);
          }}
        />
      )}

      {/* Review & Edit stage */}
      {showReview && contentJson !== null && (
        <>
          {renderProgressStepper()}
          <div className="admin-review-draft-status">
            {draftSaveStatus === 'saving' && <span className="admin-review-save-indicator">Saving draft&hellip;</span>}
            {draftSaveStatus === 'saved' && (
              <span className="admin-review-save-indicator admin-review-save-done">Draft saved</span>
            )}
          </div>
          <ContentReviewEditor
            format={format}
            contentJson={contentJson}
            wasCorrected={wasCorrected}
            corrections={corrections}
            onBuild={handleBuildFromReview}
            onBack={handleBackToForm}
            onSaveDraft={saveDraft}
          />
        </>
      )}

      {/* Building stage progress */}
      {isBuilding && (
        <div style={{ padding: '2rem 0' }}>
          {renderProgressStepper()}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span className="admin-create-spinner" /> Building document&hellip;
          </div>
        </div>
      )}

      {/* Results */}
      {showResult && (
        <div className="admin-create-result">
          <div className="admin-create-result-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M8 12l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3>{bundleResults.length > 0 ? 'Session Bundle Generated' : 'Material Generated'}</h3>
          </div>

          {bundleResults.length > 0
            ? bundleResults.map((m) => renderResultCard(m))
            : result
              ? renderResultCard(result)
              : null}

          <div className="admin-create-result-actions" style={{ marginTop: 12 }}>
            <button className="admin-refresh-btn" onClick={handleRegenerate}>
              Regenerate
            </button>
            <button className="admin-compose-btn" onClick={handleStartFresh}>
              Start Fresh
            </button>
          </div>

          {renderPreview()}
        </div>
      )}

      {/* Quick Generate panel */}
      {genStage === 'idle' && (
        <div className="admin-quickgen-panel">
          <h4>Quick Generate</h4>
          <p>
            One-click generation for common tasks
            {nextSession ? ` — next class: ${nextSession.title} (${nextSession.date})` : ''}.
          </p>
          <div className="admin-quickgen-btns">
            <button type="button" className="admin-quickgen-btn" onClick={() => handleQuickGenerate('worksheet')}>
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 8h3M7 12h5M7 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Worksheet for next class
            </button>
            <button type="button" className="admin-quickgen-btn" onClick={() => handleQuickGenerate('quiz')}>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M9 9.5a3 3 0 015.12 1.5c0 1.5-2.12 2-2.12 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Quiz for next class
            </button>
            <button type="button" className="admin-quickgen-btn" onClick={() => handleQuickGenerate('study-guide')}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path
                  d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              Study guide for this week
            </button>
          </div>
        </div>
      )}

      {/* Recently generated materials (persistent) */}
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
                    <td>
                      <span className="admin-category-badge">{m.category}</span>
                    </td>
                    <td>{formatFileSize(m.size)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="admin-compose-btn"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          onClick={() => onEmailMaterial(m.id)}
                        >
                          Email
                        </button>
                        <button
                          className="admin-compose-btn"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#dc2626' }}
                          onClick={() => handleDeleteMaterial(m.id)}
                        >
                          Delete
                        </button>
                      </div>
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
