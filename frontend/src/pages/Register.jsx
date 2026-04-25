import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register, sendRegisterOtp } from '../services/api';

export default function Register() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'author', institution: '', expertise_tags: '', otp: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await sendRegisterOtp({ email: form.email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = { ...form, expertise_tags: form.expertise_tags ? form.expertise_tags.split(',').map(t => t.trim()) : [] };
      const { data } = await register(payload);
      loginUser(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>IIITCONF</h1>
          <p>Join the IIITCONF research community. Submit your papers, contribute as a reviewer, and be part of the academic dialogue.</p>
          <div style={{ marginTop: 32 }}>
            <div style={{ padding: '16px 20px', background: 'rgba(201,168,76,0.1)', borderRadius: 8, borderLeft: '3px solid var(--gold)', marginBottom: 12 }}>
              <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Author Account</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>Submit papers, track status, respond to revisions</div>
            </div>
            <div style={{ padding: '16px 20px', background: 'rgba(201,168,76,0.1)', borderRadius: 8, borderLeft: '3px solid rgba(201,168,76,0.5)' }}>
              <div style={{ color: 'rgba(201,168,76,0.8)', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Reviewer Account</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>Get assigned papers, submit detailed reviews with scoring</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h2>Create Account</h2>
          <p className="subtitle">Join IIITCONF as an Author or Reviewer</p>

          {error && <div className="alert alert-error">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Dr. / Prof. / Your full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-control" type="email" required value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@institution.ac.in" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-control" type="password" required minLength={6} value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Register As</label>
                  <select className="form-control" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="author">Author / Student</option>
                    <option value="reviewer">Reviewer / Expert</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Institution</label>
                <input className="form-control" value={form.institution}
                  onChange={e => setForm(p => ({ ...p, institution: e.target.value }))} placeholder="IIIT Hyderabad / IIT Bombay..." />
              </div>
              {form.role === 'reviewer' && (
                <div className="form-group">
                  <label className="form-label">Expertise Areas</label>
                  <input className="form-control" value={form.expertise_tags}
                    onChange={e => setForm(p => ({ ...p, expertise_tags: e.target.value }))}
                    placeholder="Machine Learning, NLP, Computer Vision" />
                  <div className="form-hint">Comma-separated topics you can review</div>
                </div>
              )}
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Enter OTP</label>
                <input className="form-control" required value={form.otp}
                  onChange={e => setForm(p => ({ ...p, otp: e.target.value }))} placeholder="6-digit code" />
                <div className="form-hint" style={{marginTop: 8}}>An OTP was sent to {form.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 2 }}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
