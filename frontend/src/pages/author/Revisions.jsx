import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPapers, getPaper, revisePaper } from '../../services/api';
import { RotateCcw, Upload, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function RevisionRequests() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getPapers({ status: 'revision' }).then(r => setPapers(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-body">
      <div className="page-header"><div><h1>Revision Requests</h1><p>Papers that require revision.</p></div></div>
      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="spinner" /> : papers.length === 0 ? (
            <div className="empty-state"><RotateCcw /><p>No pending revision requests.</p></div>
          ) : (
            <table>
              <thead><tr><th>Title</th><th>Track</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {papers.map(p => (
                  <tr key={p.id}>
                    <td style={{ maxWidth: 280 }}><div style={{ fontWeight: 500 }}>{p.title}</div></td>
                    <td>{p.track_name || '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(p.submission_date).toLocaleDateString()}</td>
                    <td><span className={`badge badge-${p.status}`}>{p.status.replace(/_/g,' ')}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/paper/${p.id}`} className="btn btn-outline btn-sm">View</Link>
                        <Link to={`/revise/${p.id}`} className="btn btn-sm" style={{ background: '#fff8e1', color: '#b8860b', border: '1px solid #e8d080' }}>Revise</Link>
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

export function RevisePaper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [paper, setPaper] = useState(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getPaper(id).then(r => setPaper(r.data)); }, [id]);

  const handleFile = f => {
    if (f?.type === 'application/pdf') setFile(f);
    else toast.error('Only PDF files accepted.');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return toast.error('Please upload the revised PDF.');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      await revisePaper(id, fd);
      toast.success('Revised paper submitted!');
      navigate('/my-submissions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally { setLoading(false); }
  };

  if (!paper) return <div className="page-body"><div className="spinner" /></div>;

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h1>Submit Revision</h1><p>{paper.title}</p></div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          {paper.revisions?.filter(r => r.status === 'pending').map((r, i) => (
            <div key={i} className={`alert alert-${r.request_type === 'major' ? 'error' : 'warning'}`} style={{ marginBottom: 12 }}>
              <strong>{r.request_type === 'major' ? 'Major' : 'Minor'} Revision Requested</strong>
              {r.instructions && <p style={{ marginTop: 6, fontSize: '0.86rem' }}>{r.instructions}</p>}
              {r.deadline && <p style={{ marginTop: 4, fontSize: '0.78rem' }}>Deadline: {new Date(r.deadline).toLocaleDateString()}</p>}
            </div>
          ))}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Upload Revised PDF *</label>
              <div
                className={`drop-zone${dragOver ? ' active' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              >
                {file ? (
                  <>
                    <CheckCircle size={32} style={{ color: 'var(--green)', margin: '0 auto', display: 'block' }} />
                    <div className="file-name">{file.name}</div>
                  </>
                ) : (
                  <>
                    <Upload size={32} style={{ color: 'var(--text-muted)', margin: '0 auto', display: 'block' }} />
                    <p>Drop your revised PDF here or click to browse</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-gold btn-lg" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Revision'}
              </button>
              <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('/my-submissions')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
