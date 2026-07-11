import React from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const toneMap: Record<Tone, { bg: string; color: string; border: string }> = {
  neutral: { bg: 'var(--surface-2)', color: 'var(--text-secondary)', border: 'var(--border-default)' },
  accent: { bg: 'var(--accent-subtle-bg)', color: 'var(--accent-9)', border: 'var(--accent-subtle-border)' },
  success: { bg: 'var(--success-subtle-bg)', color: 'var(--success-9)', border: 'var(--success-subtle-border)' },
  warning: { bg: 'var(--warning-subtle-bg)', color: 'var(--warning-9)', border: 'var(--warning-subtle-border)' },
  danger: { bg: 'var(--danger-subtle-bg)', color: 'var(--danger-9)', border: 'var(--danger-subtle-border)' },
  info: { bg: 'var(--info-subtle-bg)', color: 'var(--info-9)', border: 'var(--info-subtle-border)' },
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', dot = false, style, children, ...rest }) => {
  const t = toneMap[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: '0.01em',
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
        ...style,
      }}
      {...rest}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />}
      {children}
    </span>
  );
};
