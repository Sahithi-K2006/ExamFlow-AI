import React from 'react';
import { Outlet } from 'react-router-dom';
import { RequireAdmin } from '../router/guards';
import { AdminShell } from './AdminShell';

export const AdminLayout: React.FC = () => (
  <RequireAdmin>
    <AdminShell>
      <Outlet />
    </AdminShell>
  </RequireAdmin>
);
