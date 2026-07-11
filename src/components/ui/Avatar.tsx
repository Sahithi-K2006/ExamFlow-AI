import React from 'react';

export interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}

const palette = ['#6C5CE7', '#00A8CC', '#E17055', '#00B894', '#D63384', '#0984E3'];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 36, color }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color || colorForName(name),
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 700,
      fontFamily: 'var(--font-display)',
      flexShrink: 0,
    }}
    aria-hidden="true"
  >
    {initials(name)}
  </div>
);
