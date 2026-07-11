import React from 'react';
import { Calendar, Camera } from 'lucide-react';
import { useApp } from '../../state';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Input } from '../ui/Field';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

export const Profile: React.FC = () => {
  const { authUser } = useApp();
  const { show } = useToast();
  const name = authUser?.name || 'Administrator';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 720 }}>
      <Card style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
        <div style={{ position: 'relative' }}>
          <Avatar name={name} size={72} />
          <button aria-label="Change avatar" style={{
            position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%',
            background: 'var(--accent-9)', border: '2px solid var(--surface-1)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Camera size={12} />
          </button>
        </div>
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Badge tone="accent">Administrator</Badge>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{authUser?.email}</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div><CardTitle>Personal Information</CardTitle><CardDescription>Update your account details</CardDescription></div>
        </CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Full Name" defaultValue={name} />
            <Input label="Email Address" type="email" defaultValue={authUser?.email} />
          </div>
          <Input label="Role" defaultValue="Administrator" disabled />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
          <Button onClick={() => show({ tone: 'success', title: 'Profile updated' })}>Save Changes</Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div><CardTitle>Change Password</CardTitle></div>
        </CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Current Password" type="password" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="New Password" type="password" />
            <Input label="Confirm New Password" type="password" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
          <Button variant="secondary" onClick={() => show({ tone: 'success', title: 'Password updated' })}>Update Password</Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} color="var(--text-tertiary)" />
            <CardTitle style={{ fontSize: 'var(--text-base)' }}>Account created</CardTitle>
          </div>
        </CardHeader>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Root Administrator account, seeded at platform setup.</p>
      </Card>
    </div>
  );
};
