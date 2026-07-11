import React from 'react';
import { Users, Clock, TrendingUp, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { LineChart } from '../ui/charts/LineChart';
import { BarChart } from '../ui/charts/BarChart';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const attendance = [42, 55, 48, 63, 71, 38, 29];
const waitTimes = [3.2, 2.8, 4.1, 3.5, 2.1, 1.8, 2.4];

const subjectScores = [
  { label: 'DSA', value: 78 },
  { label: 'DBMS', value: 65 },
  { label: 'Web', value: 82 },
  { label: 'Networks', value: 58 },
  { label: 'OS', value: 71 },
];

export const Analytics: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 640 }}>
      Cross-exam performance, attendance, and queue-health trends. Export raw data from the Reports page.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      <StatCard label="Total Attendance" value="346" icon={Users} trend={{ value: '+12%', direction: 'up' }} hint="vs last week" />
      <StatCard label="Avg. Wait Time" value="2.8m" icon={Clock} trend={{ value: '-18%', direction: 'down' }} hint="vs last week" iconColor="var(--info-9)" />
      <StatCard label="Completion Rate" value="94%" icon={TrendingUp} trend={{ value: '+3%', direction: 'up' }} iconColor="var(--success-9)" />
      <StatCard label="Avg. Score" value="71%" icon={Award} iconColor="var(--warning-9)" hint="Across all exams" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--space-4)', alignItems: 'stretch' }}>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Students who opened an exam link, by day</CardDescription>
          </div>
        </CardHeader>
        <LineChart labels={days} series={[{ name: 'Attendance', color: 'var(--accent-9)', data: attendance }]} formatValue={(v) => `${v} students`} />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Avg. Wait Time</CardTitle>
            <CardDescription>Minutes in the queue</CardDescription>
          </div>
        </CardHeader>
        <LineChart labels={days} series={[{ name: 'Wait time', color: 'var(--info-9)', data: waitTimes }]} formatValue={(v) => `${v.toFixed(1)}m`} />
      </Card>
    </div>

    <Card>
      <CardHeader>
        <div>
          <CardTitle>Average Score by Subject</CardTitle>
          <CardDescription>Across all published exams this term</CardDescription>
        </div>
      </CardHeader>
      <BarChart data={subjectScores} formatValue={(v) => `${v}%`} />
    </Card>
  </div>
);
