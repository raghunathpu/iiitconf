import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { BookOpen, Check } from 'lucide-react';

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await login(form);
      loginUser(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>IIITCONF</h1>
          <p>The smart conference management platform for academic research. Submit, review, and manage research papers with precision.</p>
          <div className="tagline">
            {['Role-based access for Authors, Reviewers & Admins','Multi-criteria review scoring system','Real-time analytics and deadline tracking','Complete paper lifecycle management'].map(t => (
              <div className="tagline-item" key={t}><Check size={16}/>{t}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to your IIITCONF account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" required
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@institution.ac.in" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" required
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No account? <Link to="/register">Register here</Link>
          </p>

          <div style={{ marginTop: 32, padding: 16, background: '#f0f4ff', borderRadius: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <strong style={{ display: 'block', marginBottom: 6 }}>Demo Credentials</strong>
            Admin: admin@iiitconf.ac.in / admin123<br/>
            Create your own author/reviewer account via Register
          </div>
        </div>
      </div>
    </div>
  );
}
