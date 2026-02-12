'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Enrollment, Lead } from './admin-types';

interface Props {
  recipients: string[];
  onChange: (recipients: string[]) => void;
  enrollments: Enrollment[];
  leads: Lead[];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EmailRecipientInput({ recipients, onChange, enrollments, leads }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = 'email-recipient-suggestions';

  // Build suggestion list from enrollments + leads
  const allEmails = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((e) => {
      if (e.email) set.add(e.email);
    });
    leads.forEach((l) => {
      if (l.email) set.add(l.email);
    });
    return Array.from(set).sort();
  }, [enrollments, leads]);

  const enrolledEmails = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((e) => {
      if (e.email) set.add(e.email);
    });
    return Array.from(set);
  }, [enrollments]);

  const leadEmails = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.email) set.add(l.email);
    });
    return Array.from(set);
  }, [leads]);

  const recipientSet = useMemo(() => new Set(recipients), [recipients]);

  // Sections for quick-add
  const sectionGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    enrollments.forEach((e) => {
      if (!e.email) return;
      const label = e.section.label;
      if (!map.has(label)) map.set(label, []);
      if (!map.get(label)!.includes(e.email)) map.get(label)!.push(e.email);
    });
    return map;
  }, [enrollments]);

  // Filtered suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return [];
    const q = inputValue.toLowerCase();
    return allEmails.filter((e) => e.toLowerCase().includes(q) && !recipientSet.has(e)).slice(0, 6);
  }, [inputValue, allEmails, recipientSet]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [suggestions.length]);

  const addRecipient = useCallback(
    (email: string) => {
      const trimmed = email.trim().toLowerCase();
      if (trimmed && !recipients.includes(trimmed)) {
        onChange([...recipients, trimmed]);
      }
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [recipients, onChange],
  );

  const removeRecipient = useCallback(
    (email: string) => {
      onChange(recipients.filter((r) => r !== email));
      inputRef.current?.focus();
    },
    [recipients, onChange],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === 'Tab' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      if (showSuggestions && suggestions[highlightIndex]) {
        addRecipient(suggestions[highlightIndex]);
      } else if (isValidEmail(inputValue.trim())) {
        addRecipient(inputValue.trim());
      }
      return;
    }
    if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      removeRecipient(recipients[recipients.length - 1]);
      return;
    }
    if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    }
    if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const emails = text
      .split(/[,\n\r;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && isValidEmail(s));
    if (emails.length > 0) {
      const newEmails = emails.filter((em) => !recipientSet.has(em));
      if (newEmails.length > 0) {
        onChange([...recipients, ...newEmails]);
      }
      setInputValue('');
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // If user types a comma, add the email before the comma
    if (val.includes(',')) {
      const parts = val.split(',');
      const toAdd = parts[0].trim().toLowerCase();
      if (toAdd && isValidEmail(toAdd) && !recipientSet.has(toAdd)) {
        onChange([...recipients, toAdd]);
      }
      setInputValue(parts.slice(1).join(','));
      return;
    }
    setInputValue(val);
    setShowSuggestions(val.trim().length > 0);
  }

  function handleQuickAdd(emails: string[]) {
    const newEmails = emails.filter((em) => !recipientSet.has(em));
    if (newEmails.length > 0) {
      onChange([...recipients, ...newEmails]);
    }
    inputRef.current?.focus();
  }

  // Net new count for quick-add buttons
  function netNewCount(emails: string[]): number {
    return emails.filter((em) => !recipientSet.has(em)).length;
  }

  const suggestionsOpen = showSuggestions && suggestions.length > 0;

  return (
    <div className="email-chip-input-wrapper" ref={containerRef}>
      <div
        className="email-chip-input"
        onClick={() => inputRef.current?.focus()}
      >
        {recipients.map((email) => (
          <span key={email} className="email-chip">
            <span className="email-chip-text">{email}</span>
            <button
              type="button"
              className="email-chip-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeRecipient(email);
              }}
              aria-label={`Remove ${email}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => {
            if (inputValue.trim()) setShowSuggestions(true);
          }}
          placeholder={recipients.length === 0 ? 'Type an email address...' : ''}
          className="email-chip-input-field"
          autoComplete="off"
          role="combobox"
          aria-expanded={suggestionsOpen}
          aria-controls={listboxId}
          aria-activedescendant={suggestionsOpen ? `suggestion-${highlightIndex}` : undefined}
        />
        {recipients.length > 0 && (
          <span className="email-chip-count">
            {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {suggestionsOpen && (
        <div className="email-chip-suggestions" role="listbox" id={listboxId}>
          {suggestions.map((email, i) => (
            <button
              key={email}
              id={`suggestion-${i}`}
              type="button"
              role="option"
              aria-selected={i === highlightIndex}
              className={`email-chip-suggestion${i === highlightIndex ? ' email-chip-suggestion-active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                addRecipient(email);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              {email}
              {enrolledEmails.includes(email) && <span className="email-chip-suggestion-tag">Enrolled</span>}
              {!enrolledEmails.includes(email) && leadEmails.includes(email) && (
                <span className="email-chip-suggestion-tag email-chip-suggestion-tag-lead">Lead</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Quick-add buttons */}
      <div className="email-quick-add">
        {enrolledEmails.length > 0 && (
          <button
            type="button"
            className="email-quick-add-btn"
            onClick={() => handleQuickAdd(enrolledEmails)}
            disabled={netNewCount(enrolledEmails) === 0}
          >
            All Enrolled ({netNewCount(enrolledEmails) < enrolledEmails.length
              ? `+${netNewCount(enrolledEmails)} of ${enrolledEmails.length}`
              : enrolledEmails.length})
          </button>
        )}
        {leadEmails.length > 0 && (
          <button
            type="button"
            className="email-quick-add-btn email-quick-add-btn-lead"
            onClick={() => handleQuickAdd(leadEmails)}
            disabled={netNewCount(leadEmails) === 0}
          >
            All Leads ({netNewCount(leadEmails) < leadEmails.length
              ? `+${netNewCount(leadEmails)} of ${leadEmails.length}`
              : leadEmails.length})
          </button>
        )}
        {Array.from(sectionGroups.entries()).map(([label, emails]) => (
          <button
            key={label}
            type="button"
            className="email-quick-add-btn email-quick-add-btn-section"
            onClick={() => handleQuickAdd(emails)}
            disabled={netNewCount(emails) === 0}
          >
            {label} ({netNewCount(emails) < emails.length
              ? `+${netNewCount(emails)} of ${emails.length}`
              : emails.length})
          </button>
        ))}
      </div>
    </div>
  );
}
