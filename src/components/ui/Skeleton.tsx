import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  radius?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, radius = 'var(--radius-sm)', circle = false, style, ...rest }) => (
  <div
    style={{
      width,
      height,
      borderRadius: circle ? '50%' : radius,
      background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 37%, var(--surface-2) 63%)',
      backgroundSize: '400% 100%',
      animation: 'shimmer 1.4s ease infinite',
      flexShrink: 0,
      ...style,
    }}
    {...rest}
  />
);

export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
    <Skeleton width="40%" height={14} />
    <Skeleton width="70%" height={22} />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} width={`${90 - i * 12}%`} height={12} />
    ))}
  </div>
);
