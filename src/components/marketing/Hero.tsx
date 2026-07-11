import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, PlayCircle } from 'lucide-react';
import { SplineScene } from '../ui/SplineScene';
import { Spotlight } from '../ui/Spotlight';
import { Button } from '../ui/Button';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'var(--surface-0)' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.9 }}>
        <SplineScene className="hero-3d-canvas" />
      </div>
      <Spotlight />

      {/* Floating geometric elements, CSS-3D, mouse-parallax-free but animated */}
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '18%', left: '8%', width: 90, height: 90, borderRadius: 24, border: '1px solid var(--accent-subtle-border)', background: 'var(--accent-subtle-bg)', backdropFilter: 'blur(6px)', transform: 'perspective(600px) rotateX(30deg) rotateY(20deg)', zIndex: 1 }}
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, 22, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '20%', right: '10%', width: 120, height: 120, borderRadius: '50%', border: '1px solid var(--info-subtle-border)', background: 'var(--info-subtle-bg)', backdropFilter: 'blur(6px)', zIndex: 1 }}
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 880, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 28 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 'var(--radius-2xl)', background: 'var(--accent-9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--shadow-accent)',
          }}>
            <Shield size={34} />
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface-1)', border: '1px solid var(--border-default)',
            padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-9)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            AI-Powered Exam Infrastructure
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 'clamp(2.75rem, 4vw + 1rem, 5rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20 }}
        >
          ExamFlow AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--accent-9)', marginBottom: 18 }}
        >
          Smarter Queue. Faster Exams. Better Experience.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto 40px', lineHeight: 'var(--leading-normal)' }}
        >
          ExamFlow AI is an AI-powered Smart Virtual Queue Management and Online Examination Platform that eliminates
          server overload, provides an intelligent waiting lounge, and delivers a seamless examination experience through
          real-time queue management, AI-powered recommendations, and enterprise-grade analytics.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.52, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <Button size="lg" icon={<ChevronRight size={18} />} iconPosition="right" onClick={() => navigate('/get-started')}>
            Get Started
          </Button>
          <Button size="lg" variant="secondary" icon={<PlayCircle size={17} />} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            Learn More
          </Button>
        </motion.div>
      </div>

      <motion.div
        aria-hidden="true"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: 'var(--text-disabled)', fontSize: 'var(--text-xs)', zIndex: 2 }}
      >
        Scroll to explore ↓
      </motion.div>
    </section>
  );
};
