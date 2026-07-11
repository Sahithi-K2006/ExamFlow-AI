import React from 'react';
import { Section, SectionHeading, Reveal } from './Reveal';
import { Card } from '../ui/Card';
import { LineChart } from '../ui/charts/LineChart';
import { StatCard } from '../ui/StatCard';
import { Users, Clock, TrendingUp, Award } from 'lucide-react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const attendance = [42, 55, 48, 63, 71, 38, 29];

export const AnalyticsSection: React.FC = () => (
  <Section id="analytics">
    <SectionHeading eyebrow="Analytics" title="Every number, one dashboard away" description="Attendance, queue health, completion rates, and score distributions — exportable to PDF, Excel, or CSV." />
    <Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard label="Total Attendance" value="346" icon={Users} trend={{ value: '+12%', direction: 'up' }} />
        <StatCard label="Avg. Wait Time" value="2.8m" icon={Clock} trend={{ value: '-18%', direction: 'down' }} iconColor="var(--info-9)" />
        <StatCard label="Completion Rate" value="94%" icon={TrendingUp} trend={{ value: '+3%', direction: 'up' }} iconColor="var(--success-9)" />
        <StatCard label="Avg. Score" value="71%" icon={Award} iconColor="var(--warning-9)" />
      </div>
      <Card padding="lg">
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>Weekly Attendance</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Students who opened an exam link, by day</p>
        </div>
        <LineChart labels={days} series={[{ name: 'Attendance', color: 'var(--accent-9)', data: attendance }]} />
      </Card>
    </Reveal>
  </Section>
);
