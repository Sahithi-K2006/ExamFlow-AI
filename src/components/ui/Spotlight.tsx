import React, { useRef, useState } from 'react';

export interface SpotlightProps {
  size?: number;
  color?: string;
}

/** Cursor-follow radial glow. Re-implemented against this project's token system
 * (no Tailwind / cn() dependency) — attaches to its own positioned parent. */
export const Spotlight: React.FC<SpotlightProps> = ({ size = 500, color = 'var(--accent-9)' }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
    >
      <div
        style={{
          position: 'absolute',
          left: pos.x - size / 2,
          top: pos.y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)`,
          opacity: visible ? 0.16 : 0,
          filter: 'blur(40px)',
          pointerEvents: 'none',
          transition: 'opacity 300ms ease',
        }}
      />
    </div>
  );
};
