import React, { useState } from 'react';

export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDatum[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

/** Minimal single-series bar chart: rounded data-ends, recessive baseline, hover tooltip. */
export const BarChart: React.FC<BarChartProps> = ({ data, color = 'var(--accent-9)', height = 200, formatValue = (v) => String(v) }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(...data.map(d => d.value), 1);
  const barGap = 12;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: barGap, height, width: '100%', position: 'relative', borderBottom: '1px solid var(--border-subtle)' }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const active = hoverIdx === i;
        return (
          <div
            key={i}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'default' }}
          >
            {active && (
              <div style={{
                position: 'absolute', bottom: `calc(${pct}% + 10px)`,
                background: 'var(--surface-3)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', padding: '4px 8px', fontSize: 'var(--text-xs)',
                fontWeight: 600, color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap',
              }}>
                {formatValue(d.value)}
              </div>
            )}
            <div
              style={{
                width: '100%',
                maxWidth: 40,
                height: `${pct}%`,
                minHeight: 2,
                background: active ? color : `color-mix(in srgb, ${color} 78%, transparent)`,
                borderRadius: '4px 4px 0 0',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            />
            <span style={{ marginTop: 8, fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};
