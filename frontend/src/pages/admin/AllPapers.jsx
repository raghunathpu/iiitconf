import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPapers, updatePaperStatus, getTracks } from '../../services/api';
import { Search, FileText, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AllPapers() {
  const [papers, setPapers] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [trackFilter, setTrackFilter] = useState('');

  const load = () => {
    setLoading(true);
    getPapers({ search, status: statusFilter, track_id: trackFilter })
      .then(r => setPapers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { getTracks().then(r => setTracks(r.data)); }, []);
  useEffect(() => { load(); }, [search, statusFilter, trackFilter]);

  const quickStatus = async (id, status) => {
    try {
      await updatePaperStatus(id, { status });
      toast.success(`Status updated to ${status}`);
      load();
    } catch { toast.error('Update failed.'); }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h1>All Papers</h1><p>{papers.length} paper(s) in the system.</p></div>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search by title or abstract..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['submitted','under_assignment','to_review','reviewed','revision','accepted','rejected','archived'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
        <select className="form-control" value={trackFilter} onChange={e => setTrackFilter(e.target.value)}>
          <option value="">All Tracks</option>
          {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="spinner" /> : papers.length === 0 ? (
            <div className="empty-state"><FileText /><p>No papers found matching your filters.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Title</th><th>Author</th><th>Track</th>
                  <th>Submitted</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {papers.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>#{p.id}</td>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{p.abstract?.slice(0, 60)}...</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>{p.author_name}</div>
                    </td>
                    <td><span style={{ fontSize: '0.78rem' }}>{p.track_name || '—'}</span></td>
                    <td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(p.submission_date).toLocaleDateString()}</span></td>
                    <td><span className={`badge badge-${p.status}`}>{p.status.replace(/_/g,' ')}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Link to={`/paper/${p.id}`} className="btn btn-outline btn-sm">View</Link>
                        <Link to={`/assign/${p.id}`} className="btn btn-sm" style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: '1px solid #c0d4f0' }}>Assign</Link>
                        {p.status === 'reviewed' && (
                          <>
                            <button className="btn btn-sm" style={{ background: 'var(--green-light)', color: 'var(--green)', border: '1px solid #b8dfc9' }}
                              onClick={() => quickStatus(p.id, 'accepted')}>Accept</button>
                            <button className="btn btn-sm btn-danger"
                              onClick={() => quickStatus(p.id, 'rejected')}>Reject</button>
                          </>
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
