import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPapers } from '../../services/api';
import { ClipboardList, CheckSquare } from 'lucide-react';

export function ToReview() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getPapers().then(r => setPapers(r.data.filter(p => p.assignment_status === 'pending'))).finally(() => setLoading(false)); }, []);
  return (
    <div className="page-body">
      <div className="page-header"><div><h1>To Review</h1><p>Papers assigned to you awaiting review.</p></div></div>
      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="spinner"/> : papers.length === 0 ? (
            <div className="empty-state"><ClipboardList/><p>No pending reviews.</p></div>
          ) : (
            <table>
              <thead><tr><th>Title</th><th>Author</th><th>Track</th><th>Deadline</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {papers.map(p => {
                  const overdue = p.review_deadline && new Date(p.review_deadline) < new Date();
                  return (
                    <tr key={p.id}>
                      <td style={{ maxWidth: 260 }}><div style={{ fontWeight: 500 }}>{p.title}</div></td>
                      <td><span style={{ fontSize: '0.8rem' }}>{p.author_name}</span></td>
                      <td><span style={{ fontSize: '0.8rem' }}>{p.track_name || '—'}</span></td>
                      <td><span style={{ fontSize: '0.78rem', color: overdue ? 'var(--red)' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400 }}>
                        {p.review_deadline ? new Date(p.review_deadline).toLocaleDateString() : '—'}
                        {overdue ? ' ⚠' : ''}
                      </span></td>
                      <td><span className={`badge badge-${p.assignment_status}`}>{p.assignment_status}</span></td>
                      <td><Link to={`/review/${p.id}`} className="btn btn-primary btn-sm">Start Review</Link></td>
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

export function Reviewed() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getPapers().then(r => setPapers(r.data.filter(p => p.assignment_status === 'completed'))).finally(() => setLoading(false)); }, []);
  return (
    <div className="page-body">
      <div className="page-header"><div><h1>Reviewed Papers</h1><p>Papers you have already reviewed.</p></div></div>
      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="spinner"/> : papers.length === 0 ? (
            <div className="empty-state"><CheckSquare/><p>No reviewed papers yet.</p></div>
          ) : (
            <table>
              <thead><tr><th>Title</th><th>Author</th><th>Track</th><th>Paper Status</th><th></th></tr></thead>
              <tbody>
                {papers.map(p => (
                  <tr key={p.id}>
                    <td style={{ maxWidth: 260 }}><div style={{ fontWeight: 500 }}>{p.title}</div></td>
                    <td><span style={{ fontSize: '0.8rem' }}>{p.author_name}</span></td>
                    <td><span style={{ fontSize: '0.8rem' }}>{p.track_name || '—'}</span></td>
                    <td><span className={`badge badge-${p.status}`}>{p.status.replace(/_/g,' ')}</span></td>
                    <td><Link to={`/review/${p.id}`} className="btn btn-outline btn-sm">View Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
