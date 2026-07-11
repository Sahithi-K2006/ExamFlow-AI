import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ style, ...rest }) => (
  <div style={{ overflowX: 'auto', width: '100%' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', ...style }} {...rest} />
  </div>
);

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = (props) => <thead {...props} />;

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ style, ...rest }) => (
  <th
    style={{
      textAlign: 'left',
      padding: '10px 16px',
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      color: 'var(--text-tertiary)',
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
      borderBottom: '1px solid var(--border-default)',
      whiteSpace: 'nowrap',
      ...style,
    }}
    {...rest}
  />
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ style, ...rest }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ borderBottom: '1px solid var(--border-subtle)', background: hover ? 'var(--surface-2)' : 'transparent', transition: 'background var(--duration-fast) var(--ease-out)', ...style }}
      {...rest}
    />
  );
};

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ style, ...rest }) => (
  <td style={{ padding: '14px 16px', color: 'var(--text-primary)', ...style }} {...rest} />
);
