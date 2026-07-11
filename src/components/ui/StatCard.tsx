import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: string; direction: 'up' | 'down' };
  hint?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, iconColor = 'var(--accent-9)', trend, hint }) => (
  <div style={{
    background: 'var(--surface-1)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      {Icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-md)',
          background: `color-mix(in srgb, ${iconColor} 14%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor,
        }}>
          <Icon size={16} />
        </div>
      )}
    </div>
    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
      {value}
    </div>
    {(trend || hint) && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)' }}>
        {trend && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600, color: trend.direction === 'up' ? 'var(--success-9)' : 'var(--danger-9)' }}>
            {trend.direction === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.value}
          </span>
        )}
        {hint && <span style={{ color: 'var(--text-tertiary)' }}>{hint}</span>}
      </div>
    )}
  </div>
);
