import React, { useEffect, useState, useCallback } from 'react';
import { Users, UserCheck, UserMinus, Activity, History, RefreshCw } from 'lucide-react';
import { useApp } from '../../state';
import { getExamSessions, type AdminSession } from '../../api/admin';
import { ApiError } from '../../api/client';
import { StatCard } from '../ui/StatCard';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, Thead, Th, Tr, Td } from '../ui/Table';
import { EmptyState } from '../ui/EmptyState';
import { Avatar } from '../ui/Avatar';

const statusBadge = (status: AdminSession['status']) => {
  if (status === 'in_progress') return <Badge tone="success" dot>In Exam</Badge>;
  if (status === 'waiting') return <Badge tone="accent" dot>Waiting</Badge>;
  if (status === 'submitted') return <Badge tone="neutral">Submitted</Badge>;
  return <Badge tone="neutral">Exited</Badge>;
};

export const QueueMonitoring: React.FC = () => {
  const { queue, capacity, forceAdmit, forceExit, refreshAdminQueue, adminExams, adminExamId, selectAdminExam } = useApp();

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    refreshAdminQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refresh once on mount
  }, []);

  const loadSessions = useCallback(() => {
    if (!adminExamId) return;
    setSessionsLoading(true);
    setSessionsError(null);
    getExamSessions(adminExamId)
      .then(setSessions)
      .catch(err => setSessionsError(err instanceof ApiError ? err.message : 'Could not load session history.'))
      .finally(() => setSessionsLoading(false));
  }, [adminExamId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const waiting = queue.filter(s => s.status === 'waiting');
  const admitted = queue.filter(s => s.status === 'admitted');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 560 }}>
          Live view of every student currently waiting for or occupying an exam slot. Updates in real time — no refresh needed.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="queue-exam-picker" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Monitoring exam</label>
          <select
            id="queue-exam-picker"
            className="form-input"
            value={adminExamId ?? ''}
            onChange={e => selectAdminExam(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 'var(--text-sm)', minWidth: 260 }}
          >
            {adminExams.length === 0 && <option value="">No exams yet</option>}
            {adminExams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Slot Capacity" value={capacity} icon={Activity} />
        <StatCard label="Waiting" value={waiting.length} icon={Users} iconColor="var(--info-9)" />
        <StatCard label="In Exam" value={admitted.length} icon={UserCheck} iconColor="var(--success-9)" hint={`${capacity > 0 ? Math.round((admitted.length / capacity) * 100) : 0}% of capacity`} />
      </div>

      <Card padding="none">
        {queue.length === 0 ? (
          <EmptyState icon={Users} title="No students in the queue" description="Waiting and in-progress students will appear here the moment they join." />
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
                  <Td>
                    {student.status === 'admitted'
                      ? <Badge tone="success" dot>In Exam</Badge>
                      : <Badge tone="accent" dot>Waiting</Badge>}
                  </Td>
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

      {/* Persisted session history — every student who ever entered this exam's queue or room,
          not just the ones currently waiting/in-progress (that's the table above). */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <History size={16} color="var(--accent-9)" /> Session History
          </h3>
          <Button size="sm" variant="secondary" icon={<RefreshCw size={13} />} onClick={loadSessions} loading={sessionsLoading}>Refresh</Button>
        </div>

        {sessionsError && (
          <div style={{ background: 'var(--danger-subtle-bg)', border: '1px solid var(--danger-subtle-border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--danger-9)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
            {sessionsError}
          </div>
        )}

        <Card padding="none">
          {!sessionsError && sessions.length === 0 ? (
            <EmptyState icon={History} title="No sessions yet" description="Every student who joins this exam's queue or room — past or present — will show up here." />
          ) : sessions.length > 0 ? (
            <Table>
              <Thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Enrollment ID</Th>
                  <Th>Status</Th>
                  <Th>Joined Queue</Th>
                  <Th>Entered Room</Th>
                  <Th>Submitted</Th>
                  <Th>Score</Th>
                </tr>
              </Thead>
              <tbody>
                {sessions.map(s => (
                  <Tr key={s.session_id}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={s.student_name} size={30} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.student_name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.student_email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{s.student_code ?? '—'}</Td>
                    <Td>{statusBadge(s.status)}</Td>
                    <Td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {s.joined_queue_at ? new Date(s.joined_queue_at).toLocaleString() : '—'}
                    </Td>
                    <Td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {s.entered_exam_at ? new Date(s.entered_exam_at).toLocaleString() : '—'}
                    </Td>
                    <Td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}
                    </Td>
                    <Td style={{ fontWeight: 600 }}>
                      {s.score !== null && s.total_marks !== null ? `${s.score}/${s.total_marks}` : '—'}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : null}
        </Card>
      </div>
    </div>
  );
};
