'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSite } from './SectionContext';

/**
 * Inline text editing.
 *
 * In the editor, section text is contentEditable and commits on blur (or ⌘/Ctrl+Enter).
 * In preview/public mode it renders as plain text — the same component, so what
 * the owner edits is exactly what ships.
 */
export function EditableText({
  sectionId,
  fieldKey,
  value,
  className,
  as = 'span',
  multiline = false,
  placeholder = 'Click to edit',
  style,
}: {
  sectionId: string;
  fieldKey: string;
  value: string;
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote' | 'p' | 'div';
  multiline?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const { editable, onText, onSelectField } = useSite();
  const ref = useRef<HTMLElement>(null);

  // Keep the DOM in sync when the value changes from outside (AI rewrite, undo).
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (node.innerText !== (value ?? '')) node.innerText = value ?? '';
  }, [value, editable]);

  const Tag = as as 'span';

  if (!editable) {
    if (!value) return null;
    // Preserve intentional line breaks written in the source copy.
    return (
      <Tag className={className} style={style}>
        {value.split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 ? <br /> : null}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLSpanElement>}
      role="textbox"
      aria-label={fieldKey}
      tabIndex={0}
      data-editable="true"
      data-empty={!value ? 'true' : undefined}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className={cn(
        'cursor-text rounded-[4px] outline-none transition-colors',
        'focus:bg-[rgba(242,106,27,.08)] focus:ring-2 focus:ring-[rgba(242,106,27,.35)]',
        'hover:bg-[rgba(242,106,27,.05)]',
        !value && 'min-w-[6ch] text-[rgba(0,0,0,.28)]',
        className,
      )}
      style={style}
      onFocus={() => onSelectField?.(sectionId, fieldKey)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          (event.target as HTMLElement).blur();
        }
        if (!multiline && event.key === 'Enter') {
          event.preventDefault();
          (event.target as HTMLElement).blur();
        }
        if (multiline && event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          (event.target as HTMLElement).blur();
        }
      }}
      onBlur={(event) => {
        const next = (event.target as HTMLElement).innerText.replace(/\u00a0/g, ' ').trim();
        if (next !== value) onText(sectionId, fieldKey, next);
      }}
    >
      {value || (editable ? placeholder : '')}
    </Tag>
  );
}

/** A plain non-editable text node that still respects line breaks. */
export function Text({ value, className, as = 'span' }: { value?: string; className?: string; as?: 'span' | 'p' | 'div' }) {
  if (!value) return null;
  const Tag = as as 'span';
  return (
    <Tag className={className}>
      {value.split('\n').map((line, i, arr) => (
        <span key={i}>
          {line}
          {i < arr.length - 1 ? <br /> : null}
        </span>
      ))}
    </Tag>
  );
}
