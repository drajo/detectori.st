import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  id: string;
  options: SelectOption[];
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  id,
  options,
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
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          'input-base',
          error ? 'border-explorer-danger focus:ring-explorer-danger' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          className,
        ].join(' ')}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-explorer-surface">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-xs text-explorer-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
