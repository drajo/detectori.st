import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-3.5 w-3.5 border-2',
  md: 'h-7 w-7 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <span
      role="status"
      aria-label="Loading..."
      className={[
        'inline-block animate-spin rounded-full border-explorer-accent border-t-transparent',
        sizeClasses[size],
        className,
      ].join(' ')}
    />
  );
};
