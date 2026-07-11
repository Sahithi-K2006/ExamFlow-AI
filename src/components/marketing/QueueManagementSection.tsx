import React, { useState, useEffect } from 'react';
import { Play, Shield, ArrowRight } from 'lucide-react';
import { Section, SectionHeading, Reveal } from './Reveal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const QueueManagementSection: React.FC = () => {
  const [trafficCount, setTrafficCount] = useState(0);
  const [visualizerState, setVisualizerState] = useState<'idle' | 'flooding' | 'managing'>('idle');
  const [admittedCounter, setAdmittedCounter] = useState(0);
  const [queueCounter, setQueueCounter] = useState(0);

  useEffect(() => {
    let interval: any;
    if (visualizerState === 'flooding') {
      interval = setInterval(() => {
        setTrafficCount(prev => {
          if (prev >= 9800) {
            setVisualizerState('managing');
            return 10000;
          }
          return prev + Math.floor(Math.random() * 800 + 400);
        });
      }, 100);
    } else if (visualizerState === 'managing') {
      setQueueCounter(10000 - admittedCounter);
      interval = setInterval(() => {
        setAdmittedCounter(prev => {
          if (prev >= 10000) {
            clearInterval(interval);
            setVisualizerState('idle');
            return 10000;
          }
          return prev + Math.floor(Math.random() * 200 + 100);
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [visualizerState, admittedCounter]);

  const triggerTrafficSimulation = () => {
    setTrafficCount(0);
    setAdmittedCounter(0);
    setQueueCounter(0);
    setVisualizerState('flooding');
  };

  return (
    <Section id="queue-management">
      <SectionHeading eyebrow="Queue Management" title="Strict FIFO, enforced by the server" description="See how the gateway filters concurrent load before it ever reaches your exam database." />

      <Reveal>
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Simulate a 10,000-student traffic spike against a 500-slot gate.</p>
            <Button variant="secondary" icon={<Play size={15} />} onClick={triggerTrafficSimulation} disabled={visualizerState !== 'idle'}>
              Simulate 10,000 Users
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1.2fr 60px 1fr', alignItems: 'center', gap: 8, background: 'var(--surface-0)', padding: '32px 16px', borderRadius: 'var(--radius-lg)', minHeight: 200, overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: 16, minWidth: 130, border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', marginBottom: 8 }}>Concurrent Traffic</h4>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: visualizerState === 'idle' ? 'var(--text-disabled)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{trafficCount.toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: visualizerState === 'flooding' ? 'var(--danger-9)' : 'var(--text-disabled)' }}>
              <ArrowRight size={18} />
              <span style={{ fontSize: '0.55rem', fontWeight: 700 }}>SPIKE</span>
            </div>
            <div style={{ background: 'var(--accent-subtle-bg)', border: `1px solid ${visualizerState !== 'idle' ? 'var(--accent-9)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-lg)', padding: '18px 16px', minWidth: 180 }}>
              <h4 style={{ color: 'var(--accent-9)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Shield size={12} /> Gateway</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--surface-0)', padding: 8, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>LOUNGE</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--info-9)' }}>{visualizerState === 'managing' ? queueCounter.toLocaleString() : (visualizerState === 'flooding' ? '…' : '0')}</div>
                </div>
                <div style={{ background: 'var(--surface-0)', padding: 8, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>LIMIT</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-9)' }}>500</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: visualizerState === 'managing' ? 'var(--success-9)' : 'var(--text-disabled)' }}>
              <ArrowRight size={18} />
              <span style={{ fontSize: '0.55rem', fontWeight: 700 }}>ADMIT</span>
            </div>
            <div style={{ background: 'var(--surface-2)', border: `1px solid ${visualizerState === 'managing' ? 'var(--success-9)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-lg)', padding: 16, minWidth: 130 }}>
              <h4 style={{ color: 'var(--success-9)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', marginBottom: 8 }}>Active Exams</h4>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--success-9)', fontFamily: 'var(--font-display)' }}>{visualizerState === 'managing' ? admittedCounter.toLocaleString() : '0'}</div>
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
};
