import React, { useEffect, useRef, useState } from 'react';

interface TagInputProps {
  id?: string;
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  disabled?: boolean;
  placeholder?: string;
  maxTags?: number;
}

const SEPARATOR_KEYS = ['Enter', ','];

export const TagInput: React.FC<TagInputProps> = ({
  id,
  label,
  value,
  onChange,
  suggestions = [],
  disabled = false,
  placeholder = 'Add tag and press Enter',
  maxTags = 20,
}) => {
  const [draft, setDraft] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const draftLower = draft.trim().toLowerCase();
  const valueSet = new Set(value.map((t) => t.toLowerCase()));
  const filteredSuggestions = suggestions
    .filter((s) => !valueSet.has(s.toLowerCase()))
    .filter((s) => draftLower === '' || s.toLowerCase().includes(draftLower))
    .slice(0, 8);

  const showDropdown = isFocused && filteredSuggestions.length > 0;

  useEffect(() => {
    if (!showDropdown) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showDropdown]);

  useEffect(() => {
    setActiveIdx(0);
  }, [draft, isFocused]);

  const commit = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (tag.length > 50) return;
    if (value.length >= maxTags) return;
    if (valueSet.has(tag.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const removeAt = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (SEPARATOR_KEYS.includes(e.key)) {
      e.preventDefault();
      if (showDropdown && filteredSuggestions[activeIdx] && draft.trim() !== '') {
        commit(filteredSuggestions[activeIdx]);
      } else {
        commit(draft);
      }
      return;
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeAt(value.length - 1);
      return;
    }
    if (showDropdown && e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filteredSuggestions.length - 1, i + 1));
      return;
    }
    if (showDropdown && e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const handleBlur = () => {
    if (draft.trim()) commit(draft);
  };

  return (
    <div ref={wrapperRef} className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-explorer-text-secondary">
          {label}
        </label>
      )}
      <div
        className={[
          'flex flex-wrap items-center gap-1.5 min-h-[42px] rounded-xl border bg-explorer-surface px-2 py-1.5 transition-colors',
          isFocused ? 'border-explorer-accent ring-2 ring-explorer-accent/20' : 'border-explorer-border',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-text',
        ].join(' ')}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-md bg-explorer-accent/10 text-explorer-accent text-xs font-medium px-2 py-1"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                aria-label={`Remove tag ${tag}`}
                className="hover:text-explorer-danger transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          disabled={disabled || value.length >= maxTags}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-explorer-text placeholder-explorer-muted focus:outline-none py-0.5 px-1"
        />
      </div>
      {showDropdown && (
        <div className="relative">
          <ul
            className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl border border-explorer-border bg-explorer-surface shadow-explorer py-1"
            role="listbox"
          >
            {filteredSuggestions.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); commit(s); inputRef.current?.focus(); }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={[
                    'w-full text-left px-3 py-2 text-sm transition-colors',
                    i === activeIdx
                      ? 'bg-explorer-accent/10 text-explorer-accent'
                      : 'text-explorer-text-secondary hover:bg-explorer-hover',
                  ].join(' ')}
                  role="option"
                  aria-selected={i === activeIdx}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {value.length >= maxTags && (
        <p className="text-xs text-explorer-muted">Maximum of {maxTags} tags reached.</p>
      )}
    </div>
  );
};
