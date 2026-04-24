import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaper, getAvailableReviewers, assignReviewer, removeAssignment } from '../../services/api';
import { UserPlus, X, ArrowLeft, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssignReviewers() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deadline, setDeadline] = useState('');

  const reload = () => {
    Promise.all([getPaper(paperId), getAvailableReviewers(paperId)])
      .then(([pr, rr]) => { setPaper(pr.data); setReviewers(rr.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [paperId]);

  const assign = async (reviewerId) => {
    try {
      await assignReviewer({ paper_id: Number(paperId), reviewer_id: reviewerId, deadline: deadline || undefined });
      toast.success('Reviewer assigned!');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed.');
    }
  };

  const remove = async (assignmentId) => {
    try {
      await removeAssignment(assignmentId);
      toast.success('Assignment removed.');
      reload();
    } catch { toast.error('Failed.'); }
  };

  if (loading) return <div className="page-body"><div className="spinner" /></div>;

  const assignedIds = new Set(paper?.assignments?.map(a => a.reviewer_id) || []);

  return (
    <div className="page-body">
      <button className="btn btn-outline btn-sm mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="page-header">
        <div>
          <h1>Assign Reviewers</h1>
          <p style={{ maxWidth: 600 }}>{paper?.title}</p>
        </div>
      </div>

      {/* Currently Assigned */}
      <div className="card mb-3">
        <div className="card-header">
          <h2>Currently Assigned ({paper?.assignments?.length || 0}/3)</h2>
        </div>
        <div className="card-body">
          {paper?.assignments?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No reviewers assigned yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paper.assignments.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--cream)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0 }}>
                    {a.reviewer_name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{a.reviewer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.reviewer_email}</div>
                    {a.expertise_tags && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(typeof a.expertise_tags === 'string' ? JSON.parse(a.expertise_tags) : a.expertise_tags || []).map(tag => (
                          <span key={tag} style={{ background: '#eaf0fb', color: 'var(--blue)', borderRadius: 20, padding: '1px 8px', fontSize: '0.7rem' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                  {a.deadline && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due {new Date(a.deadline).toLocaleDateString()}</span>}
                  <button className="btn btn-danger btn-sm" onClick={() => remove(a.id)}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deadline setting */}
      <div className="card mb-3">
        <div className="card-body" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <label className="form-label" style={{ marginBottom: 0, flexShrink: 0 }}>Set Review Deadline:</label>
          <input type="date" className="form-control" style={{ maxWidth: 200 }} value={deadline}
            onChange={e => setDeadline(e.target.value)} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Applied to next assignment</span>
        </div>
      </div>

      {/* Available Reviewers */}
      <div className="card">
        <div className="card-header">
          <h2>Available Reviewers</h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sorted by workload · Conflicts excluded</span>
        </div>
        <div className="table-wrap">
          {reviewers.length === 0 ? (
            <div className="empty-state"><Users /><p>No available reviewers. All reviewers may be assigned or in conflict.</p></div>
          ) : (
            <table>
              <thead>
                <tr><th>Reviewer</th><th>Institution</th><th>Expertise</th><th>Current Load</th><th></th></tr>
              </thead>
              <tbody>
                {reviewers.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.email}</div>
                    </td>
                    <td><span style={{ fontSize: '0.8rem' }}>{r.institution || '—'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(typeof r.expertise_tags === 'string' ? JSON.parse(r.expertise_tags || '[]') : r.expertise_tags || []).map(tag => (
                          <span key={tag} style={{ background: '#eaf0fb', color: 'var(--blue)', borderRadius: 20, padding: '1px 8px', fontSize: '0.7rem' }}>{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="score-bar">
                        <div className="score-bar-track" style={{ width: 60, height: 6 }}>
                          <div className="score-bar-fill" style={{ width: `${Math.min((r.current_load / 5) * 100, 100)}%`, background: r.current_load > 3 ? 'var(--red)' : 'var(--green)' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{r.current_load}</span>
                      </div>
                    </td>
                    <td>
                      {assignedIds.has(r.id) ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Already assigned</span>
                      ) : paper?.assignments?.length >= 3 ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Max reached</span>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => assign(r.id)}>
                          <UserPlus size={14} /> Assign
                        </button>
                      )}
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
