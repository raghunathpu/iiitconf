import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPapers } from '../../services/api';
import { ClipboardList, CheckSquare, Clock, AlertCircle } from 'lucide-react';

export default function ReviewerDashboard() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPapers().then(r => setPapers(r.data)).finally(() => setLoading(false));
  }, []);

  const pending = papers.filter(p => p.assignment_status === 'pending');
  const completed = papers.filter(p => p.assignment_status === 'completed');
  const overdue = pending.filter(p => p.review_deadline && new Date(p.review_deadline) < new Date());

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1>Reviewer Dashboard</h1>
          <p>Manage your assigned papers and submitted reviews.</p>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Assigned', value: papers.length, color: '#1e3356', bg: '#eaf0fb', icon: ClipboardList },
          { label: 'Pending Reviews', value: pending.length, color: '#2455a4', bg: '#ddeeff', icon: Clock },
          { label: 'Completed', value: completed.length, color: '#2d7a4f', bg: '#e8f5ee', icon: CheckSquare },
          { label: 'Overdue', value: overdue.length, color: '#b94040', bg: '#fdf0f0', icon: AlertCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg }}><Icon size={16} style={{ color }} /></div>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <div className="alert alert-error mb-3">
          <strong>{overdue.length} review(s) are past deadline.</strong> Please submit or contact the admin.
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Papers to Review</h2>
          <Link to="/to-review" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>View all →</Link>
        </div>
        <div className="table-wrap">
          {loading ? <div className="spinner" /> : pending.length === 0 ? (
            <div className="empty-state"><ClipboardList /><p>No pending reviews. Check back later.</p></div>
          ) : (
            <table>
              <thead><tr><th>Title</th><th>Track</th><th>Deadline</th><th>Assignment</th><th></th></tr></thead>
              <tbody>
                {pending.slice(0, 6).map(p => {
                  const isOverdue = p.review_deadline && new Date(p.review_deadline) < new Date();
                  return (
                    <tr key={p.id}>
                      <td style={{ maxWidth: 280 }}>
                        <div style={{ fontWeight: 500 }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {p.author_name}</div>
                      </td>
                      <td><span style={{ fontSize: '0.8rem' }}>{p.track_name || '—'}</span></td>
                      <td>
                        {p.review_deadline ? (
                          <span style={{ fontSize: '0.78rem', color: isOverdue ? 'var(--red)' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                            {isOverdue ? '⚠ Overdue · ' : ''}{new Date(p.review_deadline).toLocaleDateString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td><span className={`badge badge-${p.assignment_status}`}>{p.assignment_status}</span></td>
                      <td><Link to={`/review/${p.id}`} className="btn btn-primary btn-sm">Review</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
