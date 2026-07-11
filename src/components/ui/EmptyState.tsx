import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: 'var(--space-12) var(--space-6)',
    gap: 'var(--space-2)',
  }}>
    {Icon && (
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)',
        marginBottom: 'var(--space-2)',
      }}>
        <Icon size={24} />
      </div>
    )}
    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h4>
    {description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: 360 }}>{description}</p>}
    {action && <div style={{ marginTop: 'var(--space-3)' }}>{action}</div>}
  </div>
);
