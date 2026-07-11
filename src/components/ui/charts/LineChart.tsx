import React, { useId, useState } from 'react';

export interface LineChartSeries {
  name: string;
  color: string;
  data: number[];
}

export interface LineChartProps {
  labels: string[];
  series: LineChartSeries[];
  height?: number;
  formatValue?: (v: number) => string;
}

/** Minimal single/dual-series line chart. Thin 2px lines, rounded data-ends,
 * recessive gridlines, hover crosshair + tooltip — per the dataviz skill's mark spec. */
export const LineChart: React.FC<LineChartProps> = ({ labels, series, height = 200, formatValue = (v) => String(v) }) => {
  const gradientId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 600;
  const padding = { top: 16, right: 12, bottom: 24, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allValues = series.flatMap(s => s.data);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;

  const xFor = (i: number) => padding.left + (i / Math.max(1, labels.length - 1)) * innerW;
  const yFor = (v: number) => padding.top + innerH - ((v - min) / range) * innerH;

  const pathFor = (data: number[]) => data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)},${yFor(v)}`).join(' ');
  const areaFor = (data: number[]) => `${pathFor(data)} L${xFor(data.length - 1)},${padding.top + innerH} L${xFor(0)},${padding.top + innerH} Z`;

  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height, display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`${gradientId}-${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {gridLines.map((g) => (
          <line
            key={g}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * (1 - g)}
            y2={padding.top + innerH * (1 - g)}
            stroke="var(--border-subtle)"
            strokeWidth={1}
          />
        ))}

        {series.map((s, si) => (
          <path key={`area-${si}`} d={areaFor(s.data)} fill={`url(#${gradientId}-${si})`} stroke="none" />
        ))}
        {series.map((s, si) => (
          <path key={`line-${si}`} d={pathFor(s.data)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {series.map((s, si) =>
          s.data.map((v, i) => (
            <circle
              key={`${si}-${i}`}
              cx={xFor(i)}
              cy={yFor(v)}
              r={hoverIdx === i ? 4 : 0}
              fill="var(--surface-1)"
              stroke={s.color}
              strokeWidth={2}
              style={{ transition: 'r var(--duration-fast) var(--ease-out)' }}
            />
          ))
        )}

        {hoverIdx !== null && (
          <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1={padding.top} y2={padding.top + innerH} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 3" />
        )}

        {labels.map((_, i) => (
          <rect
            key={i}
            x={xFor(i) - innerW / Math.max(1, labels.length) / 2}
            y={0}
            width={innerW / Math.max(1, labels.length)}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
          />
        ))}

        {labels.map((l, i) => (
          (i === 0 || i === labels.length - 1 || i === hoverIdx) && (
            <text key={i} x={xFor(i)} y={height - 4} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'} fontSize={10} fill="var(--text-tertiary)">
              {l}
            </text>
          )
        ))}
      </svg>

      {hoverIdx !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${(xFor(hoverIdx) / width) * 100}%`,
            top: 0,
            transform: 'translate(-50%, -100%)',
            background: 'var(--surface-3)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 10px',
            fontSize: 'var(--text-xs)',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>{labels[hoverIdx]}</div>
          {series.map((s, si) => (
            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
              {formatValue(s.data[hoverIdx])}
            </div>
          ))}
        </div>
      )}

      {series.length > 1 && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
          {series.map((s, si) => (
            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              {s.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
