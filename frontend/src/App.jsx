import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Shared
import PaperDetail from './pages/PaperDetail';
import Notifications from './pages/Notifications';

// Author
import AuthorDashboard from './pages/author/AuthorDashboard';
import SubmitPaper from './pages/author/SubmitPaper';
import MySubmissions from './pages/author/MySubmissions';
import { RevisionRequests, RevisePaper } from './pages/author/Revisions';

// Reviewer
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import ReviewForm from './pages/reviewer/ReviewForm';
import { ToReview, Reviewed } from './pages/reviewer/ToReview';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AllPapers from './pages/admin/AllPapers';
import AssignReviewers from './pages/admin/AssignReviewers';
import UserManagement from './pages/admin/UserManagement';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'reviewer') return <ReviewerDashboard />;
  return <AuthorDashboard />;
}

function AssignRouter() {
  const { paperId } = { paperId: undefined };
  return <AssignReviewers />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'var(--font-body)', fontSize: '0.88rem' } }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected - Author */}
          <Route path="/dashboard" element={<ProtectedRoute><AppShell><DashboardRouter /></AppShell></ProtectedRoute>} />
          <Route path="/submit" element={<ProtectedRoute roles={['author']}><AppShell><SubmitPaper /></AppShell></ProtectedRoute>} />
          <Route path="/my-submissions" element={<ProtectedRoute roles={['author']}><AppShell><MySubmissions /></AppShell></ProtectedRoute>} />
          <Route path="/revisions" element={<ProtectedRoute roles={['author']}><AppShell><RevisionRequests /></AppShell></ProtectedRoute>} />
          <Route path="/revise/:id" element={<ProtectedRoute roles={['author']}><AppShell><RevisePaper /></AppShell></ProtectedRoute>} />

          {/* Protected - Reviewer */}
          <Route path="/to-review" element={<ProtectedRoute roles={['reviewer']}><AppShell><ToReview /></AppShell></ProtectedRoute>} />
          <Route path="/reviewed" element={<ProtectedRoute roles={['reviewer']}><AppShell><Reviewed /></AppShell></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute roles={['reviewer']}><AppShell><Reviewed /></AppShell></ProtectedRoute>} />
          <Route path="/review/:paperId" element={<ProtectedRoute roles={['reviewer']}><AppShell><ReviewForm /></AppShell></ProtectedRoute>} />

          {/* Protected - Admin */}
          <Route path="/all-papers" element={<ProtectedRoute roles={['admin']}><AppShell><AllPapers /></AppShell></ProtectedRoute>} />
          <Route path="/assign/:paperId" element={<ProtectedRoute roles={['admin']}><AppShell><AssignReviewers /></AppShell></ProtectedRoute>} />
          <Route path="/assign" element={<ProtectedRoute roles={['admin']}><AppShell><AllPapers /></AppShell></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute roles={['admin']}><AppShell><AdminDashboard /></AppShell></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><AppShell><UserManagement /></AppShell></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/paper/:id" element={<ProtectedRoute><AppShell><PaperDetail /></AppShell></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><AppShell><Notifications /></AppShell></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
