import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPapers } from '../../services/api';
import { Search, FileText, Download } from 'lucide-react';

export default function MySubmissions() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    getPapers({ search, status: statusFilter }).then(r => setPapers(r.data)).finally(() => setLoading(false));
  }, [search, statusFilter]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h1>My Submissions</h1><p>All your submitted research papers.</p></div>
        <Link to="/submit" className="btn btn-gold">+ Submit New Paper</Link>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search papers..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['submitted','under_assignment','to_review','reviewed','revision','accepted','rejected'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="spinner" /> : papers.length === 0 ? (
            <div className="empty-state"><FileText /><p>No papers found.</p></div>
          ) : (
            <table>
              <thead><tr>
                <th>Title</th><th>Track</th><th>Keywords</th><th>Submitted</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {papers.map(p => (
                  <tr key={p.id}>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontWeight: 500 }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {p.abstract?.slice(0, 80)}...
                      </div>
                    </td>
                    <td><span style={{ fontSize: '0.8rem' }}>{p.track_name || '—'}</span></td>
                    <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.keywords || '—'}</span></td>
                    <td><span style={{ fontSize: '0.78rem' }}>{new Date(p.submission_date).toLocaleDateString()}</span></td>
                    <td><span className={`badge badge-${p.status}`}>{p.status.replace(/_/g,' ')}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/paper/${p.id}`} className="btn btn-outline btn-sm">View</Link>
                        {p.status === 'revision' && (
                          <Link to={`/revise/${p.id}`} className="btn btn-sm" style={{ background: '#fff8e1', color: '#b8860b', border: '1px solid #e8d080' }}>Revise</Link>
                        )}
                      </div>
                    </td>
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
