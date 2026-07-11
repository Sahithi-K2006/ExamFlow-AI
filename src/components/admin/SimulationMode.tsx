import React, { useState } from 'react';
import { Zap, Play, Users, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatCard } from '../ui/StatCard';
import { Badge } from '../ui/Badge';

const presets = [10, 25, 50, 100];

export const SimulationMode: React.FC = () => {
  const [selected, setSelected] = useState(25);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ joined: 0, admitted: 0, completed: 0 });

  const runSimulation = () => {
    setRunning(true);
    setProgress({ joined: 0, admitted: 0, completed: 0 });
    let joined = 0;
    const interval = setInterval(() => {
      joined += Math.ceil(selected / 12);
      const admitted = Math.min(joined, Math.round(selected * 0.3));
      const completed = Math.max(0, joined - admitted - Math.round(selected * 0.1));
      setProgress({ joined: Math.min(joined, selected), admitted, completed });
      if (joined >= selected) {
        clearInterval(interval);
        setRunning(false);
      }
    }, 350);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 640 }}>
        Load-test the queue engine with synthetic students before publishing to real users. Verify the waiting lounge, auto-admission, and submission flow under load.
      </p>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Configure Simulation</CardTitle>
            <CardDescription>Choose how many synthetic students should join the queue</CardDescription>
          </div>
        </CardHeader>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setSelected(p)}
              disabled={running}
              style={{
                padding: '14px 24px', borderRadius: 'var(--radius-lg)',
                border: `1.5px solid ${selected === p ? 'var(--accent-9)' : 'var(--border-default)'}`,
                background: selected === p ? 'var(--accent-subtle-bg)' : 'var(--surface-2)',
                color: selected === p ? 'var(--accent-9)' : 'var(--text-primary)',
                fontWeight: 700, fontSize: 'var(--text-lg)', cursor: running ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)', transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <Button icon={running ? undefined : <Play size={15} />} loading={running} onClick={runSimulation}>
          {running ? 'Simulating…' : `Simulate ${selected} Students`}
        </Button>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Joined Queue" value={progress.joined} icon={Users} />
        <StatCard label="Admitted" value={progress.admitted} icon={CheckCircle2} iconColor="var(--success-9)" />
        <StatCard label="Completed" value={progress.completed} icon={Clock} iconColor="var(--info-9)" />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Simulation Log</CardTitle>
          </div>
          {progress.joined > 0 && <Badge tone={running ? 'warning' : 'success'} dot>{running ? 'Running' : 'Complete'}</Badge>}
        </CardHeader>
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', minHeight: 120 }}>
          {progress.joined === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, color: 'var(--text-disabled)', gap: 8 }}>
              <Zap size={20} />
              Simulation output will appear here
            </div>
          ) : (
            <>
              <div>[sim] spawned {progress.joined}/{selected} synthetic sessions</div>
              <div>[sim] {progress.admitted} admitted into active exam slots (FIFO)</div>
              <div>[sim] {progress.completed} completed and submitted</div>
              {!running && <div style={{ color: 'var(--success-9)' }}>[sim] simulation finished ✓</div>}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
