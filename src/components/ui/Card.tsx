import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  accent?: 'none' | 'top';
  accentColor?: string;
}

const paddingMap = { none: '0', sm: 'var(--space-4)', md: 'var(--space-6)', lg: 'var(--space-8)' };

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  interactive = false,
  accent = 'none',
  accentColor = 'var(--accent-9)',
  style,
  children,
  ...rest
}) => {
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: 'var(--surface-1)',
        border: `1px solid ${hover ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        borderTop: accent === 'top' ? `3px solid ${accentColor}` : undefined,
        borderRadius: 'var(--radius-xl)',
        padding: paddingMap[padding],
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'box-shadow var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out)',
        transform: interactive && hover ? 'translateY(-2px)' : undefined,
        cursor: interactive ? 'pointer' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, ...rest }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', ...style }} {...rest} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ style, ...rest }) => (
  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', ...style }} {...rest} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ style, ...rest }) => (
  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 'var(--leading-normal)', ...style }} {...rest} />
);
