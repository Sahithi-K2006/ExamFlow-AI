import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders, Users, UserCheck, ShieldAlert, UserMinus,
  BookOpen, FileText, BarChart3, Zap, ArrowRight,
} from 'lucide-react';
import { useApp } from '../state';
import { StatCard } from './ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Table, Thead, Th, Tr, Td } from './ui/Table';
import { EmptyState } from './ui/EmptyState';
import { Avatar } from './ui/Avatar';
import { LineChart } from './ui/charts/LineChart';

const quickActions = [
  { label: 'Question Bank', description: 'Manage reusable questions', icon: BookOpen, to: '/admin/questions' },
  { label: 'Create Exam', description: 'Build and publish a new exam', icon: FileText, to: '/admin/exams/new' },
  { label: 'Analytics', description: 'Attendance & performance trends', icon: BarChart3, to: '/admin/analytics' },
  { label: 'Simulation Mode', description: 'Load-test the queue engine', icon: Zap, to: '/admin/simulation' },
];

const waitTrend = [3.4, 2.9, 3.8, 2.1, 1.6, 2.4, 1.2];
const waitTrendLabels = ['-6h', '-5h', '-4h', '-3h', '-2h', '-1h', 'Now'];

export const AdminDashboard: React.FC = () => {
  const { capacity, setCapacity, queue, forceAdmit, forceExit, refreshAdminQueue } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    refreshAdminQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refresh once on mount
  }, []);

  const waiting = queue.filter(s => s.status === 'waiting');
  const admitted = queue.filter(s => s.status === 'admitted');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Active Exam Slots" value={capacity} icon={Sliders} hint="Configured limit gate" />
        <StatCard label="Waiting In Queue" value={waiting.length} icon={Users} iconColor="var(--info-9)" hint={waiting.length > 0 ? `~${(waiting.length * 1.5).toFixed(0)}m avg wait` : 'No wait'} />
        <StatCard label="Admitted Students" value={admitted.length} icon={UserCheck} iconColor="var(--success-9)" hint={`${capacity > 0 ? Math.round((admitted.length / capacity) * 100) : 0}% of capacity`} />
        <StatCard label="Proctoring Flags" value={0} icon={ShieldAlert} iconColor="var(--danger-9)" hint="Secure session locks" />
      </div>

      <div>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          {quickActions.map(action => (
            <Card key={action.label} interactive padding="md" onClick={() => navigate(action.to)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle-bg)', color: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <action.icon size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{action.label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{action.description}</div>
              </div>
              <ArrowRight size={14} color="var(--text-disabled)" />
            </Card>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'var(--space-4)', alignItems: 'stretch' }}>
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <CardHeader><div><CardTitle>Gatekeeper Capacity</CardTitle><CardDescription>Adjust concurrent exam slots — waiting students are admitted automatically in FIFO order.</CardDescription></div></CardHeader>
            <div style={{ background: 'var(--surface-2)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Current active slots limit</span>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-9)', fontFamily: 'var(--font-display)' }}>{capacity}</span>
              </div>
              <input
                type="range" min="0" max="10" value={capacity}
                onChange={e => setCapacity(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-9)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                <span>0 (Throttled)</span><span>5</span><span>10 (Full open)</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" fullWidth onClick={() => setCapacity(Math.max(0, capacity - 1))}>Decrease (-1)</Button>
            <Button fullWidth onClick={() => setCapacity(capacity + 1)}>Increase (+1)</Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div><CardTitle>Queue Wait Trend</CardTitle><CardDescription>Average minutes waited, last 6 hours</CardDescription></div>
            <Badge tone="success" dot>99.98% uptime</Badge>
          </CardHeader>
          <LineChart labels={waitTrendLabels} series={[{ name: 'Wait time', color: 'var(--accent-9)', data: waitTrend }]} formatValue={(v) => `${v.toFixed(1)}m`} />
        </Card>
      </div>

      <Card padding="none">
        <div style={{ padding: 'var(--space-6) var(--space-6) var(--space-4)' }}>
          <CardTitle>Live Queue Monitor</CardTitle>
          <CardDescription>Review waiting and active exam participants — override gate limits to force-admit or eject.</CardDescription>
        </div>

        {queue.length === 0 ? (
          <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
            <EmptyState icon={Users} title="No students active" description="Waiting and in-progress students will appear here in real time." />
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Student</Th>
                <Th>Enrollment ID</Th>
                <Th>Status</Th>
                <Th>Position</Th>
                <Th style={{ textAlign: 'right' }}>Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {queue.map(student => (
                <Tr key={student.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={student.name} size={30} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{student.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{student.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{student.studentId}</Td>
                  <Td>{student.status === 'admitted' ? <Badge tone="success" dot>In Exam</Badge> : <Badge tone="accent" dot>Waiting</Badge>}</Td>
                  <Td style={{ fontWeight: 600 }}>{student.status === 'admitted' ? '—' : `#${student.queuePosition}`}</Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {student.status === 'waiting' ? (
                        <Button size="sm" variant="secondary" icon={<UserCheck size={13} />} onClick={() => forceAdmit(student.id)}>Force Admit</Button>
                      ) : (
                        <Button size="sm" variant="secondary" disabled>Admitted</Button>
                      )}
                      <Button size="sm" variant="danger" icon={<UserMinus size={13} />} onClick={() => forceExit(student.id)}>Eject</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};
