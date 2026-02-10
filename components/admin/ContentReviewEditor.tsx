'use client';

import { useState, useCallback } from 'react';
import BrailleInlinePreview from './BrailleInlinePreview';
import type { CorrectionEntry } from './admin-types';

interface ContentReviewEditorProps {
  format: string;
  contentJson: unknown;
  wasCorrected: boolean;
  corrections: CorrectionEntry[];
  onBuild: (editedJson: unknown) => void;
  onBack: () => void;
  onSaveDraft: (json: unknown) => void;
}

/* ── Slide sub-editor (PPTX) ── */

interface SlideData {
  title: string;
  bullets: string[];
  speakerNotes?: string;
}

function SlideEditor({ slides, onChange }: { slides: SlideData[]; onChange: (s: SlideData[]) => void }) {
  const [collapsedNotes, setCollapsedNotes] = useState<Set<number>>(new Set(slides.map((_, i) => i)));

  const updateSlide = (idx: number, field: string, value: unknown) => {
    const updated = [...slides];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const updateBullet = (sIdx: number, bIdx: number, value: string) => {
    const updated = [...slides];
    const bullets = [...updated[sIdx].bullets];
    bullets[bIdx] = value;
    updated[sIdx] = { ...updated[sIdx], bullets };
    onChange(updated);
  };

  const addBullet = (sIdx: number) => {
    const updated = [...slides];
    updated[sIdx] = { ...updated[sIdx], bullets: [...updated[sIdx].bullets, ''] };
    onChange(updated);
  };

  const removeBullet = (sIdx: number, bIdx: number) => {
    const updated = [...slides];
    const bullets = updated[sIdx].bullets.filter((_, i) => i !== bIdx);
    updated[sIdx] = { ...updated[sIdx], bullets };
    onChange(updated);
  };

  const toggleNotes = (idx: number) => {
    setCollapsedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="admin-review-cards">
      {slides.map((slide, i) => (
        <div key={i} className="admin-review-card">
          <div className="admin-review-card-header">
            <span className="admin-review-card-num">Slide {i + 1}</span>
          </div>
          <input
            className="admin-compose-input admin-review-input"
            value={slide.title}
            onChange={(e) => updateSlide(i, 'title', e.target.value)}
            placeholder="Slide title"
          />
          <div className="admin-review-bullets">
            {slide.bullets.map((b, bi) => (
              <div key={bi} className="admin-review-bullet-row">
                <input
                  className="admin-compose-input admin-review-input"
                  value={b}
                  onChange={(e) => updateBullet(i, bi, e.target.value)}
                  placeholder="Bullet point"
                />
                <button
                  type="button"
                  className="admin-review-remove-btn"
                  onClick={() => removeBullet(i, bi)}
                  title="Remove bullet"
                >
                  &times;
                </button>
              </div>
            ))}
            <button type="button" className="admin-review-add-btn" onClick={() => addBullet(i)}>
              + Add bullet
            </button>
          </div>
          <button type="button" className="admin-review-toggle-btn" onClick={() => toggleNotes(i)}>
            {collapsedNotes.has(i) ? 'Show' : 'Hide'} speaker notes
          </button>
          {!collapsedNotes.has(i) && (
            <textarea
              className="admin-compose-textarea admin-review-textarea"
              value={slide.speakerNotes || ''}
              onChange={(e) => updateSlide(i, 'speakerNotes', e.target.value)}
              placeholder="Speaker notes (optional)"
              rows={3}
            />
          )}
          <BrailleInlinePreview text={`${slide.title} ${slide.bullets.join(' ')}`} />
        </div>
      ))}
    </div>
  );
}

/* ── Section sub-editor (PDF, Study Guide) ── */

interface SectionData {
  heading: string;
  content: string;
  bullets?: string[];
  keyTerms?: string[];
  practiceQuestions?: string[];
}

function SectionEditor({
  sections,
  isStudyGuide,
  onChange,
}: {
  sections: SectionData[];
  isStudyGuide: boolean;
  onChange: (s: SectionData[]) => void;
}) {
  const updateSection = (idx: number, field: string, value: unknown) => {
    const updated = [...sections];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const updateListItem = (sIdx: number, field: keyof SectionData, iIdx: number, value: string) => {
    const updated = [...sections];
    const list = [...((updated[sIdx][field] as string[] | undefined) || [])];
    list[iIdx] = value;
    updated[sIdx] = { ...updated[sIdx], [field]: list };
    onChange(updated);
  };

  const addListItem = (sIdx: number, field: keyof SectionData) => {
    const updated = [...sections];
    const list = [...((updated[sIdx][field] as string[] | undefined) || []), ''];
    updated[sIdx] = { ...updated[sIdx], [field]: list };
    onChange(updated);
  };

  const removeListItem = (sIdx: number, field: keyof SectionData, iIdx: number) => {
    const updated = [...sections];
    const list = ((updated[sIdx][field] as string[] | undefined) || []).filter((_, i) => i !== iIdx);
    updated[sIdx] = { ...updated[sIdx], [field]: list };
    onChange(updated);
  };

  return (
    <div className="admin-review-cards">
      {sections.map((section, i) => (
        <div key={i} className="admin-review-card">
          <div className="admin-review-card-header">
            <span className="admin-review-card-num">Section {i + 1}</span>
          </div>
          <input
            className="admin-compose-input admin-review-input"
            value={section.heading}
            onChange={(e) => updateSection(i, 'heading', e.target.value)}
            placeholder="Section heading"
          />
          <textarea
            className="admin-compose-textarea admin-review-textarea"
            value={section.content || ''}
            onChange={(e) => updateSection(i, 'content', e.target.value)}
            placeholder="Section content"
            rows={4}
          />
          {section.bullets && section.bullets.length > 0 && (
            <div className="admin-review-list-section">
              <span className="admin-review-list-label">Bullets</span>
              {section.bullets.map((b, bi) => (
                <div key={bi} className="admin-review-bullet-row">
                  <input
                    className="admin-compose-input admin-review-input"
                    value={b}
                    onChange={(e) => updateListItem(i, 'bullets', bi, e.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-review-remove-btn"
                    onClick={() => removeListItem(i, 'bullets', bi)}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button type="button" className="admin-review-add-btn" onClick={() => addListItem(i, 'bullets')}>
                + Add bullet
              </button>
            </div>
          )}
          {isStudyGuide && (
            <>
              <div className="admin-review-list-section">
                <span className="admin-review-list-label">Key Terms</span>
                {(section.keyTerms || []).map((t, ti) => (
                  <div key={ti} className="admin-review-bullet-row">
                    <input
                      className="admin-compose-input admin-review-input"
                      value={t}
                      onChange={(e) => updateListItem(i, 'keyTerms', ti, e.target.value)}
                    />
                    <button
                      type="button"
                      className="admin-review-remove-btn"
                      onClick={() => removeListItem(i, 'keyTerms', ti)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button type="button" className="admin-review-add-btn" onClick={() => addListItem(i, 'keyTerms')}>
                  + Add term
                </button>
              </div>
              <div className="admin-review-list-section">
                <span className="admin-review-list-label">Practice Questions</span>
                {(section.practiceQuestions || []).map((q, qi) => (
                  <div key={qi} className="admin-review-bullet-row">
                    <input
                      className="admin-compose-input admin-review-input"
                      value={q}
                      onChange={(e) => updateListItem(i, 'practiceQuestions', qi, e.target.value)}
                    />
                    <button
                      type="button"
                      className="admin-review-remove-btn"
                      onClick={() => removeListItem(i, 'practiceQuestions', qi)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="admin-review-add-btn"
                  onClick={() => addListItem(i, 'practiceQuestions')}
                >
                  + Add question
                </button>
              </div>
            </>
          )}
          <BrailleInlinePreview
            text={`${section.heading} ${section.content || ''} ${(section.bullets || []).join(' ')} ${(section.keyTerms || []).join(' ')}`}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Worksheet sub-editor ── */

interface WorksheetItem {
  prompt: string;
  answer: string;
}

interface WorksheetSection {
  heading: string;
  type: string;
  instructions: string;
  items: WorksheetItem[];
}

const WORKSHEET_TYPES = [
  'fill-in-the-blank',
  'matching',
  'practice-drill',
  'braille-to-print',
  'print-to-braille',
  'dot-identification',
];

function WorksheetEditor({
  sections,
  onChange,
}: {
  sections: WorksheetSection[];
  onChange: (s: WorksheetSection[]) => void;
}) {
  const updateSection = (idx: number, field: string, value: unknown) => {
    const updated = [...sections];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const updateItem = (sIdx: number, iIdx: number, field: 'prompt' | 'answer', value: string) => {
    const updated = [...sections];
    const items = [...updated[sIdx].items];
    items[iIdx] = { ...items[iIdx], [field]: value };
    updated[sIdx] = { ...updated[sIdx], items };
    onChange(updated);
  };

  const addItem = (sIdx: number) => {
    const updated = [...sections];
    updated[sIdx] = { ...updated[sIdx], items: [...updated[sIdx].items, { prompt: '', answer: '' }] };
    onChange(updated);
  };

  const removeItem = (sIdx: number, iIdx: number) => {
    const updated = [...sections];
    updated[sIdx] = { ...updated[sIdx], items: updated[sIdx].items.filter((_, i) => i !== iIdx) };
    onChange(updated);
  };

  return (
    <div className="admin-review-cards">
      {sections.map((section, i) => (
        <div key={i} className="admin-review-card">
          <div className="admin-review-card-header">
            <span className="admin-review-card-num">Section {i + 1}</span>
            <select
              className="admin-review-type-select"
              value={section.type}
              onChange={(e) => updateSection(i, 'type', e.target.value)}
            >
              {WORKSHEET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <input
            className="admin-compose-input admin-review-input"
            value={section.heading}
            onChange={(e) => updateSection(i, 'heading', e.target.value)}
            placeholder="Section heading"
          />
          <textarea
            className="admin-compose-textarea admin-review-textarea"
            value={section.instructions}
            onChange={(e) => updateSection(i, 'instructions', e.target.value)}
            placeholder="Instructions"
            rows={2}
          />
          <div className="admin-review-items">
            {section.items.map((item, ii) => (
              <div key={ii} className="admin-review-item-row">
                <span className="admin-review-item-num">{ii + 1}.</span>
                <input
                  className="admin-compose-input admin-review-input"
                  value={item.prompt}
                  onChange={(e) => updateItem(i, ii, 'prompt', e.target.value)}
                  placeholder="Prompt"
                />
                <input
                  className="admin-compose-input admin-review-input admin-review-input-answer"
                  value={item.answer}
                  onChange={(e) => updateItem(i, ii, 'answer', e.target.value)}
                  placeholder="Answer"
                />
                <button type="button" className="admin-review-remove-btn" onClick={() => removeItem(i, ii)}>
                  &times;
                </button>
              </div>
            ))}
            <button type="button" className="admin-review-add-btn" onClick={() => addItem(i)}>
              + Add item
            </button>
          </div>
          <BrailleInlinePreview text={section.items.map((it) => `${it.prompt} ${it.answer}`).join(' ')} />
        </div>
      ))}
    </div>
  );
}

/* ── Quiz sub-editor ── */

interface QuizQuestion {
  type: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

const QUIZ_TYPES = ['multiple-choice', 'true-false', 'short-answer'];

function QuizEditor({ questions, onChange }: { questions: QuizQuestion[]; onChange: (q: QuizQuestion[]) => void }) {
  const updateQuestion = (idx: number, field: string, value: unknown) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...questions];
    const options = [...(updated[qIdx].options || [])];
    options[oIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options };
    onChange(updated);
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], options: [...(updated[qIdx].options || []), ''] };
    onChange(updated);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], options: (updated[qIdx].options || []).filter((_, i) => i !== oIdx) };
    onChange(updated);
  };

  return (
    <div className="admin-review-cards">
      {questions.map((q, i) => (
        <div key={i} className="admin-review-card">
          <div className="admin-review-card-header">
            <span className="admin-review-card-num">Q{i + 1}</span>
            <select
              className="admin-review-type-select"
              value={q.type}
              onChange={(e) => updateQuestion(i, 'type', e.target.value)}
            >
              {QUIZ_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="admin-compose-textarea admin-review-textarea"
            value={q.question}
            onChange={(e) => updateQuestion(i, 'question', e.target.value)}
            placeholder="Question"
            rows={2}
          />
          {(q.type === 'multiple-choice' || q.type === 'true-false') && q.options && (
            <div className="admin-review-list-section">
              <span className="admin-review-list-label">Options</span>
              {q.options.map((opt, oi) => (
                <div key={oi} className="admin-review-bullet-row">
                  <input
                    className="admin-compose-input admin-review-input"
                    value={opt}
                    onChange={(e) => updateOption(i, oi, e.target.value)}
                  />
                  {q.type === 'multiple-choice' && (
                    <button type="button" className="admin-review-remove-btn" onClick={() => removeOption(i, oi)}>
                      &times;
                    </button>
                  )}
                </div>
              ))}
              {q.type === 'multiple-choice' && (
                <button type="button" className="admin-review-add-btn" onClick={() => addOption(i)}>
                  + Add option
                </button>
              )}
            </div>
          )}
          <input
            className="admin-compose-input admin-review-input"
            value={q.answer}
            onChange={(e) => updateQuestion(i, 'answer', e.target.value)}
            placeholder="Answer"
          />
          <textarea
            className="admin-compose-textarea admin-review-textarea"
            value={q.explanation}
            onChange={(e) => updateQuestion(i, 'explanation', e.target.value)}
            placeholder="Explanation"
            rows={2}
          />
          <BrailleInlinePreview text={`${q.question} ${(q.options || []).join(' ')} ${q.answer}`} />
        </div>
      ))}
    </div>
  );
}

/* ── Main ContentReviewEditor ── */

export default function ContentReviewEditor({
  format,
  contentJson,
  wasCorrected,
  corrections,
  onBuild,
  onBack,
  onSaveDraft,
}: ContentReviewEditorProps) {
  const [data, setData] = useState<unknown>(contentJson);
  const [bundleTab, setBundleTab] = useState<'slides' | 'handout' | 'worksheet'>('slides');

  const d = data as Record<string, unknown>;

  const handleChange = useCallback(
    (updated: unknown) => {
      setData(updated);
      onSaveDraft(updated);
    },
    [onSaveDraft],
  );

  // For session-bundle, update only the active sub-section
  const handleBundleChange = useCallback(
    (key: string, value: unknown) => {
      setData((prev: unknown) => {
        const next = { ...(prev as Record<string, unknown>), [key]: value };
        onSaveDraft(next);
        return next;
      });
    },
    [onSaveDraft],
  );

  function renderEditor() {
    switch (format) {
      case 'pptx':
        return (
          <SlideEditor slides={(d.slides || []) as SlideData[]} onChange={(slides) => handleChange({ ...d, slides })} />
        );

      case 'pdf':
        return (
          <SectionEditor
            sections={(d.sections || []) as SectionData[]}
            isStudyGuide={false}
            onChange={(sections) => handleChange({ ...d, sections })}
          />
        );

      case 'study-guide':
        return (
          <>
            {d.objectives && (
              <div className="admin-review-card" style={{ marginBottom: 12 }}>
                <div className="admin-review-card-header">
                  <span className="admin-review-card-num">Objectives</span>
                </div>
                {(d.objectives as string[]).map((obj, i) => (
                  <div key={i} className="admin-review-bullet-row">
                    <input
                      className="admin-compose-input admin-review-input"
                      value={obj}
                      onChange={(e) => {
                        const objs = [...(d.objectives as string[])];
                        objs[i] = e.target.value;
                        handleChange({ ...d, objectives: objs });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            <SectionEditor
              sections={(d.sections || []) as SectionData[]}
              isStudyGuide={true}
              onChange={(sections) => handleChange({ ...d, sections })}
            />
          </>
        );

      case 'worksheet':
        return (
          <WorksheetEditor
            sections={(d.sections || []) as WorksheetSection[]}
            onChange={(sections) => handleChange({ ...d, sections })}
          />
        );

      case 'quiz':
        return (
          <QuizEditor
            questions={(d.questions || []) as QuizQuestion[]}
            onChange={(questions) => handleChange({ ...d, questions })}
          />
        );

      case 'session-bundle':
        return (
          <div className="admin-review-bundle">
            <div className="admin-review-bundle-tabs">
              <button
                type="button"
                className={`admin-review-bundle-tab ${bundleTab === 'slides' ? 'admin-review-bundle-tab-active' : ''}`}
                onClick={() => setBundleTab('slides')}
              >
                Slides
              </button>
              <button
                type="button"
                className={`admin-review-bundle-tab ${bundleTab === 'handout' ? 'admin-review-bundle-tab-active' : ''}`}
                onClick={() => setBundleTab('handout')}
              >
                Handout
              </button>
              <button
                type="button"
                className={`admin-review-bundle-tab ${bundleTab === 'worksheet' ? 'admin-review-bundle-tab-active' : ''}`}
                onClick={() => setBundleTab('worksheet')}
              >
                Worksheet
              </button>
            </div>
            {bundleTab === 'slides' && (
              <SlideEditor
                slides={(d.slides || []) as SlideData[]}
                onChange={(slides) => handleBundleChange('slides', slides)}
              />
            )}
            {bundleTab === 'handout' && (
              <SectionEditor
                sections={(d.handoutSections || []) as SectionData[]}
                isStudyGuide={false}
                onChange={(sections) => handleBundleChange('handoutSections', sections)}
              />
            )}
            {bundleTab === 'worksheet' && (
              <WorksheetEditor
                sections={(d.worksheetSections || []) as WorksheetSection[]}
                onChange={(sections) => handleBundleChange('worksheetSections', sections)}
              />
            )}
          </div>
        );

      default:
        return <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>;
    }
  }

  return (
    <div className="admin-review-editor">
      <div className="admin-review-editor-header">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <h3>Review &amp; Edit Content</h3>
          <p>Review the AI-generated content below. Edit any fields, then build the final document.</p>
        </div>
      </div>

      {wasCorrected && corrections.length > 0 && (
        <div className="admin-review-corrections">
          <div className="admin-review-corrections-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <strong>AI Error Corrected</strong> — {corrections.length} braille dot pattern
            {corrections.length > 1 ? 's were' : ' was'} automatically fixed
          </div>
          <ul className="admin-review-corrections-list">
            {corrections.map((c, i) => (
              <li key={i}>
                <strong>{c.letterOrContraction}</strong>: <del>{c.original}</del> → <strong>{c.corrected}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {renderEditor()}

      <div className="admin-review-actions">
        <button type="button" className="admin-send-btn" onClick={() => onBuild(data)}>
          Build Final Document
        </button>
        <button type="button" className="admin-compose-btn" onClick={onBack}>
          Back to Form
        </button>
      </div>
    </div>
  );
}
