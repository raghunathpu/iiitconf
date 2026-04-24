import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPapers } from '../../services/api';
import { FileText, FilePlus, RotateCcw, CheckCircle, Clock } from 'lucide-react';

export default function AuthorDashboard() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPapers().then(r => setPapers(r.data)).finally(() => setLoading(false));
  }, []);

  const counts = {
    total: papers.length,
    submitted: papers.filter(p => p.status === 'submitted').length,
    under_review: papers.filter(p => ['to_review', 'under_assignment'].includes(p.status)).length,
    revision: papers.filter(p => p.status === 'revision').length,
    accepted: papers.filter(p => p.status === 'accepted').length,
    rejected: papers.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1>Welcome, {user.name.split(' ')[0]}</h1>
          <p>Track your paper submissions and review lifecycle below.</p>
        </div>
        <Link to="/submit" className="btn btn-gold btn-lg">
          <FilePlus size={16} /> Submit New Paper
        </Link>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Submissions', value: counts.total, color: '#1e3356', bg: '#eaf0fb' },
          { label: 'Submitted', value: counts.submitted, color: '#3a5080', bg: '#e8edf5' },
          { label: 'Under Review', value: counts.under_review, color: '#2455a4', bg: '#eaf0fb' },
          { label: 'Revision Needed', value: counts.revision, color: '#b8860b', bg: '#fff8e1' },
          { label: 'Accepted', value: counts.accepted, color: '#2d7a4f', bg: '#e8f5ee' },
          { label: 'Rejected', value: counts.rejected, color: '#b94040', bg: '#fdf0f0' },
        ].map(({ label, value, color, bg }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg }}><FileText size={16} style={{ color }} /></div>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Recent Submissions</h2>
          <Link to="/my-submissions" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>View all →</Link>
        </div>
        <div className="table-wrap">
          {loading ? <div className="spinner" /> : papers.length === 0 ? (
            <div className="empty-state">
              <FileText />
              <p>No submissions yet. <Link to="/submit">Submit your first paper</Link></p>
            </div>
          ) : (
            <table>
              <thead><tr>
                <th>Title</th><th>Track</th><th>Submitted</th><th>Status</th><th></th>
              </tr></thead>
              <tbody>
                {papers.slice(0, 8).map(p => (
                  <tr key={p.id}>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{p.title}</div>
                    </td>
                    <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.track_name || '—'}</span></td>
                    <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(p.submission_date).toLocaleDateString()}</span></td>
                    <td><span className={`badge badge-${p.status}`}>{p.status.replace(/_/g, ' ')}</span></td>
                    <td><Link to={`/paper/${p.id}`} className="btn btn-outline btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {counts.revision > 0 && (
        <div className="alert alert-warning mt-2" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RotateCcw size={16} />
          You have {counts.revision} paper(s) awaiting revision. <Link to="/revisions" style={{ marginLeft: 8 }}>View revision requests →</Link>
        </div>
      )}
    </div>
  );
}
