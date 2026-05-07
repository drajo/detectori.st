import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  id: string;
  rows?: number;
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  id,
  rows = 4,
  placeholder,
  value,
  onChange,
  disabled,
  required,
  className = '',
  ...rest
}) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-explorer-text-secondary">
          {label}
          {required && <span className="ml-1 text-explorer-gold" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          'input-base resize-vertical',
          error ? 'border-explorer-danger focus:ring-explorer-danger' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-xs text-explorer-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
