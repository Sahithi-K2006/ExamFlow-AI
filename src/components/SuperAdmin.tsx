import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../state';
import {
  Cpu, HardDrive, Network, Terminal, Trash2, LogIn, RefreshCw
} from 'lucide-react';
import { listActivityLog, type ApiActivityLog } from '../api/students';
import { ApiError } from '../api/client';

export const SuperAdmin: React.FC = () => {
  const {
    maintenanceMode, setMaintenanceMode,
    serverHealth,
    auditLogs, clearLogs, addLog
  } = useApp();

  // Settings configs
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [dbBackupState, setDbBackupState] = useState<'idle' | 'running' | 'success'>('idle');

  // Login History — real, database-backed (persists across refresh/sessions), unlike the
  // "Live Auditing Console" below which is just this browser tab's in-memory event feed.
  const [loginHistory, setLoginHistory] = useState<ApiActivityLog[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [loginHistoryError, setLoginHistoryError] = useState<string | null>(null);

  const loadLoginHistory = useCallback(() => {
    setLoginHistoryLoading(true);
    setLoginHistoryError(null);
    listActivityLog(100, 'login')
      .then(setLoginHistory)
      .catch(err => setLoginHistoryError(err instanceof ApiError ? err.message : 'Could not load login history.'))
      .finally(() => setLoginHistoryLoading(false));
  }, []);

  useEffect(() => {
    loadLoginHistory();
  }, [loadLoginHistory]);

  const toggleMaintenance = () => {
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    addLog(`SuperAdmin toggled global maintenance mode to: ${nextState ? 'ENABLED' : 'DISABLED'}`, 'danger');
  };

  const runBackup = () => {
    setDbBackupState('running');
    addLog('Database backup triggered by SuperAdmin.', 'warning');
    setTimeout(() => {
      setDbBackupState('success');
      addLog('Database snapshot backup completed successfully (S3 region: ap-south-1).', 'success');
      setTimeout(() => setDbBackupState('idle'), 3000);
    }, 2000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      
      {/* Super Admin Top Banner & Maintenance Switch */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '4px solid var(--accent-pink)' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ color: '#fff', fontSize: '1.6rem' }}>Root Infrastructure Controller</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Global server configurations, DB snapshots, licensing, and security event auditing.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Global Maintenance Mode</span>
          <button 
            onClick={toggleMaintenance} 
            className={`btn ${maintenanceMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              background: maintenanceMode ? 'var(--accent-pink)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              padding: '6px 14px', 
              fontSize: '0.8rem',
              boxShadow: maintenanceMode ? '0 0 15px rgba(236, 72, 153, 0.4)' : 'none'
            }}
          >
            {maintenanceMode ? 'ENABLED (OFFLINE)' : 'DISABLED (ONLINE)'}
          </button>
        </div>
      </div>

      {/* Main content grids */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Left Side: Server Health Meters & Systems Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <h3 style={{ color: '#fff', fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>Server Resource Health</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Metric 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Cpu size={14} /> CPU Processor Load
                </span>
                <span style={{ fontWeight: 'bold', color: serverHealth.cpu > 80 ? 'var(--color-danger)' : '#fff' }}>{serverHealth.cpu}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${serverHealth.cpu}%`, height: '100%', background: 'linear-gradient(to right, var(--accent-purple), var(--accent-pink))', transition: 'width 1s ease' }} />
              </div>
            </div>

            {/* Metric 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <HardDrive size={14} /> Memory Heap Allocations
                </span>
                <span style={{ fontWeight: 'bold' }}>{serverHealth.memory}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${serverHealth.memory}%`, height: '100%', background: 'var(--accent-purple)', transition: 'width 1s ease' }} />
              </div>
            </div>

            {/* Metric 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Network size={14} /> Net I/O (Traffic Throttles)
                </span>
                <span style={{ fontWeight: 'bold', color: serverHealth.networkLoad > 80 ? 'var(--color-danger)' : '#fff' }}>{serverHealth.networkLoad}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${serverHealth.networkLoad}%`, height: '100%', background: 'var(--accent-cyan)', transition: 'width 1s ease' }} />
              </div>
            </div>

          </div>

          {/* Infrastructure Controls */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px', marginTop: '10px' }}>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '14px' }}>System Control Board</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Session Timeout Limit</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    style={{ width: '60px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}
                    value={sessionTimeout}
                    onChange={e => setSessionTimeout(parseInt(e.target.value))}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>min</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Database Snapshots</span>
                <button className="btn btn-secondary btn-sm" onClick={runBackup} disabled={dbBackupState === 'running'}>
                  {dbBackupState === 'idle' && 'Trigger DB Backup'}
                  {dbBackupState === 'running' && 'Running...'}
                  {dbBackupState === 'success' && '✓ Backup Success'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Centralized Auditing Console Terminal */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '380px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} color="var(--accent-cyan)" /> Live Auditing Console
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={clearLogs} style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.1)' }}>
              <Trash2 size={12} /> Clear Logs
            </button>
          </div>

          <div style={{
            flex: 1,
            background: '#04050a',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            padding: '16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            overflowY: 'auto',
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {auditLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                Console idle. Trigger actions in Student or Admin views to see live audit logs.
              </div>
            ) : (
              auditLogs.map(log => {
                let badgeColor = 'var(--text-muted)';
                if (log.type === 'success') badgeColor = 'var(--color-success)';
                if (log.type === 'warning') badgeColor = 'var(--color-warning)';
                if (log.type === 'danger') badgeColor = 'var(--color-danger)';
                if (log.type === 'info') badgeColor = 'var(--accent-cyan)';

                return (
                  <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>[{log.timestamp}]</span>
                    <span style={{ color: badgeColor }}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Persisted Login History — real database rows via GET /api/admin/activity-log?event_type=login,
          unlike the Live Auditing Console above (that's just this browser tab's in-memory event feed). */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
          <h3 style={{ color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogIn size={18} color="var(--accent-cyan)" /> Login History
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadLoginHistory}
            disabled={loginHistoryLoading}
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={12} style={loginHistoryLoading ? { animation: 'spin 0.8s linear infinite' } : undefined} /> Refresh
          </button>
        </div>

        {loginHistoryError && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', padding: '12px 0' }}>{loginHistoryError}</div>
        )}

        {!loginHistoryError && !loginHistoryLoading && loginHistory.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontSize: '0.85rem' }}>
            No logins recorded yet.
          </div>
        )}

        {loginHistory.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 500 }}>User</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 500 }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 500 }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 500 }}>IP Address</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 500 }}>Device / Browser</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 10px', color: '#fff' }}>{log.student_name ?? 'Unknown'}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {log.user_role === 'admin' ? 'Admin' : log.user_role === 'student' ? 'Student' : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{log.ip_address ?? '—'}</td>
                    <td
                      style={{ padding: '8px 10px', color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={log.browser ?? undefined}
                    >
                      {log.device ?? '—'}{log.browser ? ` · ${log.browser}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
