import React from 'react';
import { Bell, Shield, Palette, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useToast } from '../ui/Toast';

const Toggle: React.FC<{ defaultChecked?: boolean }> = ({ defaultChecked }) => {
  const [on, setOn] = React.useState(!!defaultChecked);
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => setOn(v => !v)}
      style={{
        width: 40, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
        background: on ? 'var(--accent-9)' : 'var(--surface-3)', transition: 'background var(--duration-fast) var(--ease-out)', flexShrink: 0,
      }}
    >
      <span style={{ position: 'absolute', top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left var(--duration-fast) var(--ease-out)', boxShadow: 'var(--shadow-xs)' }} />
    </button>
  );
};

const Row: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-subtle)' }}>
    <div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{label}</div>
      {description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{description}</div>}
    </div>
    {children}
  </div>
);

export const AdminSettings: React.FC = () => {
  const { show } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 720 }}>
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Palette size={17} color="var(--accent-9)" />
            <div><CardTitle>Appearance</CardTitle><CardDescription>Choose how ExamFlow AI looks on your device</CardDescription></div>
          </div>
        </CardHeader>
        <Row label="Theme" description="Switch between light and dark mode"><ThemeToggle /></Row>
      </Card>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={17} color="var(--accent-9)" />
            <div><CardTitle>Notifications</CardTitle><CardDescription>Control what triggers an alert</CardDescription></div>
          </div>
        </CardHeader>
        <Row label="Student joins queue" description="Notify when a new student enters the waiting lounge"><Toggle defaultChecked /></Row>
        <Row label="Proctoring violation" description="Notify on tab-switch or focus-loss detections"><Toggle defaultChecked /></Row>
        <Row label="Exam completion" description="Notify when an exam finishes or reaches capacity"><Toggle /></Row>
      </Card>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={17} color="var(--accent-9)" />
            <div><CardTitle>Security</CardTitle><CardDescription>Session and access controls</CardDescription></div>
          </div>
        </CardHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', paddingTop: 'var(--space-2)' }}>
          <Input label="Session Timeout (minutes)" type="number" defaultValue={30} />
          <Select label="Password Policy" defaultValue="strong">
            <option value="standard">Standard</option>
            <option value="strong">Strong</option>
          </Select>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe size={17} color="var(--accent-9)" />
            <div><CardTitle>Regional</CardTitle></div>
          </div>
        </CardHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', paddingTop: 'var(--space-2)' }}>
          <Select label="Timezone" defaultValue="ist">
            <option value="ist">India Standard Time (UTC+5:30)</option>
            <option value="utc">UTC</option>
          </Select>
          <Select label="Date Format" defaultValue="dmy">
            <option value="dmy">DD/MM/YYYY</option>
            <option value="mdy">MM/DD/YYYY</option>
          </Select>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => show({ tone: 'success', title: 'Settings saved' })}>Save Changes</Button>
      </div>
    </div>
  );
};
