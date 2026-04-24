import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaper, getMyReview, submitReview, downloadPaper, declineAssignment } from '../../services/api';
import { Download, Save, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CRITERIA = [
  { key: 'originality_score', label: 'Originality', hint: 'Is this work novel and original?', max: 10 },
  { key: 'technical_quality_score', label: 'Technical Quality', hint: 'Is the methodology sound?', max: 10 },
  { key: 'relevance_score', label: 'Relevance', hint: 'Is it relevant to the conference?', max: 10 },
  { key: 'clarity_score', label: 'Clarity & Readability', hint: 'Is the paper clearly written?', max: 10 },
  { key: 'presentation_score', label: 'Presentation', hint: 'Quality of figures, formatting', max: 10 },
  { key: 'confidence_score', label: 'Reviewer Confidence', hint: 'How confident are you in this review?', max: 5 },
];

const defaultForm = {
  originality_score: 5, technical_quality_score: 5, relevance_score: 5,
  clarity_score: 5, presentation_score: 5, confidence_score: 3,
  recommendation: 'accept', detailed_comments: '', private_comments: '', author_comments: ''
};

export default function ReviewForm() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getPaper(paperId), getMyReview(paperId)]).then(([pr, rr]) => {
      setPaper(pr.data);
      if (rr.data) { setExistingReview(rr.data); setForm({ ...defaultForm, ...rr.data }); }
    }).finally(() => setLoading(false));
  }, [paperId]);

  const overallScore = () => {
    const scores = [form.originality_score, form.technical_quality_score, form.relevance_score, form.clarity_score, form.presentation_score];
    return (scores.reduce((a, b) => a + Number(b), 0) / scores.length).toFixed(1);
  };

  const save = async (submit = false) => {
    if (submit && !form.detailed_comments.trim()) {
      toast.error('Detailed comments are required before submitting.');
      return;
    }
    setSaving(true);
    try {
      await submitReview({ paper_id: Number(paperId), ...form, is_submitted: submit });
      toast.success(submit ? 'Review submitted successfully!' : 'Draft saved.');
      if (submit) navigate('/reviewed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save review.');
    } finally { setSaving(false); }
  };

  const handleDownload = async () => {
    try {
      const res = await downloadPaper(paperId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `paper_${paperId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed.'); }
  };

  if (loading) return <div className="page-body"><div className="spinner" /></div>;
  if (!paper) return <div className="page-body"><div className="alert alert-error">Paper not found.</div></div>;
  if (existingReview?.is_submitted) return (
    <div className="page-body">
      <div className="alert alert-success">You have already submitted your review for this paper.</div>
      <div className="card mt-2">
        <div className="card-header"><h2>Your Submitted Review</h2></div>
        <div className="card-body">
          <p><strong>Recommendation:</strong> <span className={`badge badge-${existingReview.recommendation}`}>{existingReview.recommendation.replace(/_/g,' ')}</span></p>
          <p className="mt-2"><strong>Overall Score:</strong> {existingReview.overall_score}/10</p>
          <p className="mt-2"><strong>Comments:</strong></p>
          <p style={{ fontSize:'0.88rem', color:'var(--text-muted)', marginTop: 4 }}>{existingReview.detailed_comments}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h1>Review Paper</h1><p>Submit your detailed peer review below.</p></div>
      </div>

      {/* Paper info */}
      <div className="card mb-3">
        <div className="card-header">
          <div>
            <h2>{paper.title}</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{paper.track_name}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleDownload}><Download size={14}/> Download PDF</button>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7 }}><strong>Abstract:</strong> {paper.abstract}</p>
          {paper.keywords && <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keywords: {paper.keywords}</p>}
        </div>
      </div>

      {/* Scoring */}
      <div className="card mb-3">
        <div className="card-header">
          <h2>Evaluation Scores</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Overall Score:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--navy)' }}>{overallScore()}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/10</span></span>
          </div>
        </div>
        <div className="card-body">
          {CRITERIA.map(({ key, label, hint, max }) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hint}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy)', minWidth: 40, textAlign: 'right' }}>
                  {form[key]}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/{max}</span>
                </span>
              </div>
              <div className="score-bar">
                <input type="range" min={1} max={max} value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--gold)' }} />
              </div>
              <div className="score-bar-track" style={{ marginTop: 4 }}>
                <div className="score-bar-fill" style={{ width: `${(form[key] / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="card mb-3">
        <div className="card-header"><h2>Recommendation</h2></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { value: 'accept', label: '✓ Accept', color: '#2d7a4f', bg: '#e8f5ee', border: '#b8dfc9' },
              { value: 'minor_revision', label: '↺ Minor Rev.', color: '#b8860b', bg: '#fff8e1', border: '#e8d080' },
              { value: 'major_revision', label: '↺ Major Rev.', color: '#c4611a', bg: '#fef4ec', border: '#f0b080' },
              { value: 'reject', label: '✗ Reject', color: '#b94040', bg: '#fdf0f0', border: '#f0c0c0' },
            ].map(({ value, label, color, bg, border }) => (
              <button key={value} type="button"
                onClick={() => setForm(p => ({ ...p, recommendation: value }))}
                style={{
                  padding: '12px 8px', border: `2px solid ${form.recommendation === value ? color : border}`,
                  borderRadius: 6, background: form.recommendation === value ? bg : '#fff',
                  color: form.recommendation === value ? color : 'var(--text-muted)',
                  fontWeight: form.recommendation === value ? 700 : 400, cursor: 'pointer',
                  fontSize: '0.82rem', transition: 'all 0.15s'
                }}>
                {label}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Comments * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(visible to admin and author)</span></label>
            <textarea className="form-control" rows={6} value={form.detailed_comments}
              onChange={e => setForm(p => ({ ...p, detailed_comments: e.target.value }))}
              placeholder="Provide thorough feedback on the paper's strengths and weaknesses..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Comments to Author <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(optional)</span></label>
              <textarea className="form-control" rows={3} value={form.author_comments}
                onChange={e => setForm(p => ({ ...p, author_comments: e.target.value }))}
                placeholder="Specific comments/suggestions for the author..." />
            </div>
            <div className="form-group">
              <label className="form-label">Private Comments to Admin <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(confidential)</span></label>
              <textarea className="form-control" rows={3} value={form.private_comments}
                onChange={e => setForm(p => ({ ...p, private_comments: e.target.value }))}
                placeholder="Internal notes for the program committee..." />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-gold btn-lg" onClick={() => save(true)} disabled={saving}>
          <Send size={16}/> {saving ? 'Submitting...' : 'Submit Review'}
        </button>
        <button className="btn btn-outline btn-lg" onClick={() => save(false)} disabled={saving}>
          <Save size={16}/> Save Draft
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/to-review')}>Cancel</button>
      </div>

      <div className="alert alert-info mt-2" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
        Once submitted, you cannot edit your review. Save as draft until you're ready.
      </div>
    </div>
  );
}
