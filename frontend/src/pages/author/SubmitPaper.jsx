import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPaper, getTracks } from '../../services/api';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubmitPaper() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [tracks, setTracks] = useState([]);
  const [form, setForm] = useState({ title: '', abstract: '', keywords: '', track_id: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { getTracks().then(r => setTracks(r.data)); }, []);

  const handleFile = f => {
    if (f && f.type === 'application/pdf') setFile(f);
    else toast.error('Only PDF files are accepted.');
  };

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return toast.error('Please upload a PDF file.');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('pdf', file);
      await submitPaper(fd);
      toast.success('Paper submitted successfully!');
      navigate('/my-submissions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1>Submit Paper</h1>
          <p>Fill in your paper details and upload the PDF for review.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
        <div className="card mb-3">
          <div className="card-header"><h2>Paper Details</h2></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Paper Title *</label>
              <input className="form-control" required value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Full title of your research paper" />
            </div>

            <div className="form-group">
              <label className="form-label">Abstract *</label>
              <textarea className="form-control" required rows={6} value={form.abstract}
                onChange={e => setForm(p => ({ ...p, abstract: e.target.value }))}
                placeholder="Write a concise abstract (150–300 words) describing your research..." />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Keywords</label>
                <input className="form-control" value={form.keywords}
                  onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))}
                  placeholder="machine learning, NLP, transformer" />
                <div className="form-hint">Comma-separated keywords</div>
              </div>
              <div className="form-group">
                <label className="form-label">Track / Topic</label>
                <select className="form-control" value={form.track_id}
                  onChange={e => setForm(p => ({ ...p, track_id: e.target.value }))}>
                  <option value="">— Select a track —</option>
                  {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header"><h2>Upload Paper (PDF)</h2></div>
          <div className="card-body">
            <div
              className={`drop-zone${dragOver ? ' active' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <CheckCircle size={32} style={{ color: 'var(--green)', margin: '0 auto', display: 'block' }} />
                  <div className="file-name">{file.name}</div>
                  <p style={{ fontSize: '0.78rem', marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
                </>
              ) : (
                <>
                  <Upload size={32} style={{ color: 'var(--text-muted)', margin: '0 auto', display: 'block' }} />
                  <p>Drag & drop your PDF here, or click to browse</p>
                  <p style={{ fontSize: '0.75rem', marginTop: 4 }}>Max size: 10MB · PDF only</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-gold btn-lg" disabled={loading}>
            <FileText size={16} />
            {loading ? 'Submitting...' : 'Submit Paper'}
          </button>
          <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('/my-submissions')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
