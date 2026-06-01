import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Loader } from '@/components/ui/Loader';

interface Props {
  minRole?: string;
}

const ROLE_LEVEL: Record<string, number> = {
  superadmin: 6, admin: 5, dirigeant: 4, coach: 3, joueur: 2, parent: 2, visiteur: 1
};

export const Layout: React.FC<Props> = ({ minRole = 'visiteur' }) => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 900);
  const location = useLocation();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  const userLevel = ROLE_LEVEL[user.role] || 0;
  const requiredLevel = ROLE_LEVEL[minRole] || 0;
  if (userLevel < requiredLevel) return <Navigate to="/dashboard" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} />
      <div style={{
        marginLeft: sidebarOpen ? 'var(--sidebar-w)' : 0,
        flex: 1, display: 'flex', flexDirection: 'column',
        minHeight: '100vh', transition: 'margin var(--transition)'
      }}>
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <main style={{ flex: 1, padding: 28, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
