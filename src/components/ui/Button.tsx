import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', gap: 6 },
  md: { padding: '10px 16px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-md)', gap: 8 },
  lg: { padding: '13px 22px', fontSize: 'var(--text-base)', borderRadius: 'var(--radius-md)', gap: 8 },
};

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent-9)',
    color: 'var(--text-on-accent)',
    border: '1px solid transparent',
    boxShadow: 'var(--shadow-xs)',
  },
  secondary: {
    background: 'var(--surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--danger-subtle-bg)',
    color: 'var(--danger-9)',
    border: '1px solid var(--danger-subtle-border)',
  },
  success: {
    background: 'var(--success-9)',
    color: 'var(--text-on-accent)',
    border: '1px solid transparent',
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  children,
  style,
  className,
  ...rest
}) => {
  const [hover, setHover] = React.useState(false);

  const hoverStyle: React.CSSProperties = hover && !disabled && !loading
    ? variant === 'primary'
      ? { background: 'var(--accent-10)', boxShadow: 'var(--shadow-sm), var(--shadow-accent)', transform: 'translateY(-1px)' }
      : variant === 'secondary'
        ? { background: 'var(--surface-3)', border: '1px solid var(--border-strong)' }
        : variant === 'ghost'
          ? { background: 'var(--surface-2)', color: 'var(--text-primary)' }
          : variant === 'danger'
            ? { background: 'var(--danger-9)', color: 'var(--text-on-accent)', border: '1px solid transparent' }
            : { filter: 'brightness(1.08)', transform: 'translateY(-1px)' }
    : {};

  return (
    <button
      className={className}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: `all var(--duration-fast) var(--ease-out)`,
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...hoverStyle,
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin-icon" style={{ animation: 'spin 0.8s linear infinite' }} />
      ) : (
        icon && iconPosition === 'left' && icon
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
};
