import React from 'react';
import { motion } from 'framer-motion';

export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; style?: React.CSSProperties }> = ({ children, delay = 0, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    style={style}
  >
    {children}
  </motion.div>
);

export const SectionHeading: React.FC<{ eyebrow?: string; title: string; description?: string; center?: boolean }> = ({ eyebrow, title, description, center = true }) => (
  <Reveal>
    <div style={{ textAlign: center ? 'center' : 'left', maxWidth: 640, margin: center ? '0 auto 48px' : '0 0 48px' }}>
      {eyebrow && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 700,
          color: 'var(--accent-9)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
          background: 'var(--accent-subtle-bg)', border: '1px solid var(--accent-subtle-border)', padding: '4px 12px', borderRadius: 'var(--radius-full)',
        }}>
          {eyebrow}
        </div>
      )}
      <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: description ? 12 : 0, letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      {description && <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{description}</p>}
    </div>
  </Reveal>
);

export const Section: React.FC<{ children: React.ReactNode; id?: string; alt?: boolean; style?: React.CSSProperties }> = ({ children, id, alt, style }) => (
  <section id={id} style={{ padding: '96px 24px', background: alt ? 'var(--surface-1)' : 'transparent', ...style }}>
    <div style={{ maxWidth: 1160, margin: '0 auto' }}>{children}</div>
  </section>
);
