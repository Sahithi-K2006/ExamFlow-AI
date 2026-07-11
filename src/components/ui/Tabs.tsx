import React from 'react';

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ items, value, onChange }) => (
  <div role="tablist" style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 4, borderRadius: 'var(--radius-lg)', width: 'fit-content' }}>
    {items.map(item => {
      const active = item.value === value;
      return (
        <button
          key={item.value}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: active ? 'var(--surface-1)' : 'transparent',
            color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            boxShadow: active ? 'var(--shadow-xs)' : 'none',
            transition: 'all var(--duration-fast) var(--ease-out)',
          }}
        >
          {item.icon}
          {item.label}
        </button>
      );
    })}
  </div>
);
