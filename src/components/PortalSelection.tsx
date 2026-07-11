import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';
import { ParticleField } from './ui/ParticleField';

const portals = [
  {
    key: 'student',
    emoji: '🎓',
    title: 'Student Portal',
    description: 'Sign in to view scheduled exams, join the live queue, and take your assessments.',
    to: '/login',
    color: 'var(--accent-9)',
  },
  {
    key: 'admin',
    emoji: '🛡',
    title: 'Admin Portal',
    description: 'Restricted access for administrators — manage exams, questions, and live queue monitoring.',
    to: '/admin/login',
    color: 'var(--info-9)',
  },
];

export const PortalSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <ParticleField density={45} />
      </div>

      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
          padding: '8px 14px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 2,
          fontFamily: 'var(--font-sans)',
        }}
      >
        <ArrowLeft size={14} /> Back to Home
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 48 }}
      >
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.02em' }}>
          Choose your portal
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: 460 }}>
          ExamFlow AI keeps student and administrator access completely separate for security.
        </p>
      </motion.div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 780 }}>
        {portals.map((portal, i) => (
          <motion.div
            key={portal.key}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            style={{ width: 320 }}
          >
            <Card
              padding="lg"
              interactive
              onClick={() => navigate(portal.to)}
              style={{ cursor: 'pointer', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: `color-mix(in srgb, ${portal.color} 14%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: '1.75rem',
              }}>
                {portal.emoji}
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{portal.title}</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)', marginBottom: 24, flex: 1 }}>{portal.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: portal.color, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                Continue <ChevronRight size={16} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
