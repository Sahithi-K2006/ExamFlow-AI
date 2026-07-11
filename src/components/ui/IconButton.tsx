import React from 'react';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'ghost' | 'secondary';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  variant?: Variant;
  'aria-label': string;
}

const dims: Record<Size, number> = { sm: 28, md: 34, lg: 40 };

export const IconButton: React.FC<IconButtonProps> = ({ size = 'md', variant = 'ghost', style, children, ...rest }) => {
  const [hover, setHover] = React.useState(false);
  const d = dims[size];

  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: d,
        height: d,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-md)',
        border: variant === 'secondary' ? '1px solid var(--border-default)' : '1px solid transparent',
        background: hover ? 'var(--surface-2)' : variant === 'secondary' ? 'var(--surface-1)' : 'transparent',
        color: hover ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all var(--duration-fast) var(--ease-out)',
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
};
