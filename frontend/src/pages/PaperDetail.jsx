import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPaper, getPaperReviews, updatePaperStatus, requestRevision, downloadPaper, getReviewComparison } from '../services/api';
import { Download, ArrowLeft, Star, MessageSquare, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaperDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');
  const [revModal, setRevModal] = useState(false);
  const [revForm, setRevForm] = useState({ request_type: 'minor', instructions: '', deadline: '' });
  const [statusForm, setStatusForm] = useState({ status: '', admin_notes: '' });

  useEffect(() => {
    Promise.all([
      getPaper(id),
      getPaperReviews(id).catch(() => ({ data: [] })),
      user.role === 'admin' ? getReviewComparison(id).catch(() => ({ data: null })) : Promise.resolve({ data: null })
    ]).then(([pr, rr, cr]) => {
      setPaper(pr.data);
      setReviews(rr.data);
      setComparison(cr.data);
      setStatusForm(f => ({ ...f, status: pr.data.status, admin_notes: pr.data.admin_notes || '' }));
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    try {
      const res = await downloadPaper(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = paper.file_name || `paper_${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed.'); }
  };

  const handleStatusUpdate = async () => {
    try {
      await updatePaperStatus(id, statusForm);
      toast.success('Status updated.');
      setPaper(p => ({ ...p, status: statusForm.status }));
    } catch { toast.error('Update failed.'); }
  };

  const handleRevisionRequest = async () => {
    try {
      await requestRevision(id, revForm);
      toast.success('Revision requested.');
      setRevModal(false);
      setPaper(p => ({ ...p, status: 'revision' }));
    } catch { toast.error('Failed.'); }
  };

  if (loading) return <div className="page-body"><div className="spinner" /></div>;
  if (!paper) return <div className="page-body"><div className="alert alert-error">Paper not found.</div></div>;

  const ScoreRow = ({ label, score, max = 10 }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ width: 160, fontSize: '0.82rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <div className="score-bar-track" style={{ flex: 1, height: 8 }}>
        <div className="score-bar-fill" style={{ width: `${(score / max) * 100}%` }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, minWidth: 36 }}>{score}/{max}</span>
    </div>
  );

  return (
    <div className="page-body">
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card mb-3">
            <div className="card-header">
              <div>
                <h2 style={{ fontSize: '1.3rem' }}>{paper.title}</h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  By {paper.author_name} · {paper.track_name || 'No track'} · Submitted {new Date(paper.submission_date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <span className={`badge badge-${paper.status}`} style={{ fontSize: '0.85rem', padding: '5px 14px' }}>{paper.status.replace(/_/g, ' ')}</span>
                <button className="btn btn-outline btn-sm" onClick={handleDownload}><Download size={14} /> PDF</button>
              </div>
            </div>
            <div className="card-body">
              <div className="tabs">
                {['details', 'reviews', ...(user.role === 'admin' ? ['comparison','admin'] : [])].map(t => (
                  <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </div>
                ))}
              </div>

              {tab === 'details' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Abstract</label>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text)' }}>{paper.abstract}</p>
                  </div>
                  {paper.keywords && (
                    <div className="form-group">
                      <label className="form-label">Keywords</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {paper.keywords.split(',').map(k => (
                          <span key={k} style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: '0.78rem' }}>{k.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {paper.admin_notes && (
                    <div className="alert alert-info">
                      <strong>Admin Notes:</strong> {paper.admin_notes}
                    </div>
                  )}
                  {paper.revisions?.length > 0 && (
                    <div>
                      <label className="form-label mt-2">Revision History</label>
                      {paper.revisions.map((r, i) => (
                        <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 14, marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span className={`badge badge-${r.request_type}_revision`}>{r.request_type} revision</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          {r.instructions && <p style={{ fontSize: '0.85rem' }}>{r.instructions}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'reviews' && (
                <div>
                  {reviews.length === 0 ? (
                    <div className="empty-state"><MessageSquare /><p>No reviews submitted yet.</p></div>
                  ) : (
                    reviews.map((r, i) => (
                      <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 20, marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <div>
                            <strong style={{ fontSize: '0.9rem' }}>{user.role === 'admin' ? r.reviewer_name : `Reviewer ${i + 1}`}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submitted {new Date(r.submitted_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className={`badge badge-${r.recommendation}`}>{r.recommendation.replace(/_/g, ' ')}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy)' }}>{r.overall_score}/10</span>
                          </div>
                        </div>
                        <ScoreRow label="Originality" score={r.originality_score} />
                        <ScoreRow label="Technical Quality" score={r.technical_quality_score} />
                        <ScoreRow label="Relevance" score={r.relevance_score} />
                        <ScoreRow label="Clarity" score={r.clarity_score} />
                        <ScoreRow label="Presentation" score={r.presentation_score} />
                        <ScoreRow label="Confidence" score={r.confidence_score} max={5} />
                        {r.detailed_comments && (
                          <div style={{ marginTop: 14, padding: 12, background: 'var(--cream)', borderRadius: 4 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>DETAILED COMMENTS</div>
                            <p style={{ fontSize: '0.86rem', lineHeight: 1.7 }}>{r.detailed_comments}</p>
                          </div>
                        )}
                        {r.author_comments && (
                          <div style={{ marginTop: 10, padding: 12, background: '#f0f4ff', borderRadius: 4 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--blue)', marginBottom: 6 }}>COMMENTS TO AUTHOR</div>
                            <p style={{ fontSize: '0.86rem', lineHeight: 1.7 }}>{r.author_comments}</p>
                          </div>
                        )}
                        {user.role === 'admin' && r.private_comments && (
                          <div style={{ marginTop: 10, padding: 12, background: '#fff8e1', borderRadius: 4 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b8860b', marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                              <Lock size={12} /> PRIVATE NOTES (Admin Only)
                            </div>
                            <p style={{ fontSize: '0.86rem', lineHeight: 1.7 }}>{r.private_comments}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'comparison' && user.role === 'admin' && comparison && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div style={{ textAlign: 'center', padding: 20, background: 'var(--cream)', borderRadius: 6 }}>
                      <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)' }}>{comparison.aggregate.avgScore}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Avg. Score / 10</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20, background: 'var(--cream)', borderRadius: 6 }}>
                      <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)' }}>{comparison.aggregate.totalReviews}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Total Reviews</div>
                    </div>
                    <div style={{ padding: 20, background: 'var(--cream)', borderRadius: 6 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>RECOMMENDATIONS</div>
                      {Object.entries(comparison.aggregate.recommendations).map(([rec, cnt]) => (
                        <div key={rec} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.82rem' }}>
                          <span className={`badge badge-${rec}`}>{rec.replace(/_/g, ' ')}</span>
                          <strong>{cnt}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Full review details visible in the Reviews tab.</p>
                </div>
              )}

              {tab === 'admin' && user.role === 'admin' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Update Status</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <select className="form-control" value={statusForm.status} onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
                        {['submitted','under_assignment','to_review','reviewed','revision','accepted','rejected','archived'].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <button className="btn btn-primary" onClick={handleStatusUpdate}>Update</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Notes</label>
                    <textarea className="form-control" rows={3} value={statusForm.admin_notes}
                      onChange={e => setStatusForm(f => ({ ...f, admin_notes: e.target.value }))} />
                    <button className="btn btn-outline btn-sm mt-1" onClick={handleStatusUpdate}>Save Notes</button>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 8, display: 'flex', gap: 10 }}>
                    <Link to={`/assign/${paper.id}`} className="btn btn-primary">Manage Reviewers</Link>
                    <button className="btn btn-outline" onClick={() => setRevModal(true)}>Request Revision</button>
                    <button className="btn btn-sm" style={{ background: 'var(--green-light)', color: 'var(--green)', border: '1px solid #b8dfc9' }}
                      onClick={() => { setStatusForm(f => ({ ...f, status: 'accepted' })); setTimeout(handleStatusUpdate, 0); }}>Accept Paper</button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => { setStatusForm(f => ({ ...f, status: 'rejected' })); setTimeout(handleStatusUpdate, 0); }}>Reject Paper</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div className="card mb-2">
            <div className="card-body" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paper Info</div>
              <div style={{ fontSize: '0.8rem', lineHeight: 2, color: 'var(--text)' }}>
                <div><strong>ID:</strong> #{paper.id}</div>
                <div><strong>Author:</strong> {paper.author_name}</div>
                <div><strong>Institution:</strong> {paper.author_institution || '—'}</div>
                <div><strong>Track:</strong> {paper.track_name || '—'}</div>
                <div><strong>Submitted:</strong> {new Date(paper.submission_date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {paper.assignments?.length > 0 && (
            <div className="card mb-2">
              <div className="card-body" style={{ padding: 16 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviewers ({paper.assignments.length})</div>
                {paper.assignments.map(a => (
                  <div key={a.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.82rem' }}>{a.reviewer_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.reviewer_email}</div>
                    <span className={`badge badge-${a.status}`} style={{ marginTop: 4 }}>{a.status}</span>
                    {a.deadline && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>Due {new Date(a.deadline).toLocaleDateString()}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.role === 'reviewer' && (
            <div className="card">
              <div className="card-body" style={{ padding: 16 }}>
                <Link to={`/review/${paper.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Write Review
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revision Modal */}
      {revModal && (
        <div className="modal-overlay" onClick={() => setRevModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Revision</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setRevModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Revision Type</label>
                <select className="form-control" value={revForm.request_type} onChange={e => setRevForm(f => ({ ...f, request_type: e.target.value }))}>
                  <option value="minor">Minor Revision</option>
                  <option value="major">Major Revision</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Instructions for Author</label>
                <textarea className="form-control" rows={4} value={revForm.instructions}
                  onChange={e => setRevForm(f => ({ ...f, instructions: e.target.value }))}
                  placeholder="Describe what changes are required..." />
              </div>
              <div className="form-group">
                <label className="form-label">Revision Deadline</label>
                <input type="date" className="form-control" value={revForm.deadline}
                  onChange={e => setRevForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setRevModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRevisionRequest}>Send Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
