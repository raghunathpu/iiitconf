import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, FilePlus, RotateCcw, CheckSquare,
  History, Bell, Users, BarChart2, ClipboardList, Settings, LogOut,
  BookOpen, UserCog
} from 'lucide-react';

const authorNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/submit', icon: FilePlus, label: 'Submit Paper' },
  { to: '/my-submissions', icon: FileText, label: 'My Submissions' },
  { to: '/revisions', icon: RotateCcw, label: 'Revision Requests' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const reviewerNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/to-review', icon: ClipboardList, label: 'To Review' },
  { to: '/reviewed', icon: CheckSquare, label: 'Reviewed' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/all-papers', icon: FileText, label: 'All Papers' },
  { to: '/assign', icon: ClipboardList, label: 'Assign Reviewers' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/users', icon: Users, label: 'User Management' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const navByRole = { author: authorNav, reviewer: reviewerNav, admin: adminNav };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const navItems = navByRole[user.role] || authorNav;
  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>IIITCONF</h1>
        <p>Conference Management</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {user.role === 'admin' ? 'Administration' : user.role === 'reviewer' ? 'Reviewer' : 'Author'}
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
        </div>
        <button
          className="nav-item"
          style={{ width: '100%', marginTop: 8, background: 'rgba(185,64,64,0.1)', color: '#ff9090', borderLeft: 'none', borderRadius: 4 }}
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
