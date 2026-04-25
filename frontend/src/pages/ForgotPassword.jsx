import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/api';
import { KeyRound, MailCheck } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async e => {
    e.preventDefault();
    setError(''); setMsg(''); setLoading(true);
    try {
      const { data } = await forgotPassword({ email: form.email });
      setMsg(data.message || 'OTP sent successfully.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async e => {
    e.preventDefault();
    setError(''); setMsg(''); setLoading(true);
    try {
      const { data } = await resetPassword(form);
      setMsg(data.message || 'Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>IIITCONF</h1>
          <p>Recover your account to continue managing your research submissions and reviews.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h2>Reset Password</h2>
          <p className="subtitle">{step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}</p>

          {error && <div className="alert alert-error">{error}</div>}
          {msg && <div className="alert alert-success" style={{ background: 'rgba(40,167,69,0.1)', color: '#28a745', border: '1px solid rgba(40,167,69,0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{msg}</div>}

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <MailCheck size={18} style={{ position: 'absolute', top: 13, left: 14, color: 'var(--text-muted)' }} />
                  <input className="form-control" type="email" required style={{ paddingLeft: 42 }}
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@institution.ac.in" />
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" readOnly value={form.email} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">OTP</label>
                <input className="form-control" required value={form.otp}
                  onChange={e => setForm(p => ({ ...p, otp: e.target.value }))} placeholder="6-digit OTP" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', top: 13, left: 14, color: 'var(--text-muted)' }} />
                  <input className="form-control" type="password" required minLength={6} style={{ paddingLeft: 42 }}
                    value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min. 6 characters" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(1)} style={{ flex: 1 }} disabled={loading}>Back</button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2 }} disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Remembered your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
