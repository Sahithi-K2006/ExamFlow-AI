import React, { useEffect } from 'react';
import { Users, UserCheck, UserMinus, Activity } from 'lucide-react';
import { useApp } from '../../state';
import { StatCard } from '../ui/StatCard';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, Thead, Th, Tr, Td } from '../ui/Table';
import { EmptyState } from '../ui/EmptyState';
import { Avatar } from '../ui/Avatar';

export const QueueMonitoring: React.FC = () => {
  const { queue, capacity, forceAdmit, forceExit, refreshAdminQueue } = useApp();

  useEffect(() => {
    refreshAdminQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refresh once on mount
  }, []);

  const waiting = queue.filter(s => s.status === 'waiting');
  const admitted = queue.filter(s => s.status === 'admitted');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Live view of every student currently waiting for or occupying an exam slot. Updates in real time — no refresh needed.
        </p>
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
    </div>
  );
};
