import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileText, Users, CheckCircle, Clock, TrendingUp, Star } from 'lucide-react';

const STATUS_COLORS = {
  submitted: '#3a5080', under_assignment: '#c4611a', to_review: '#2455a4',
  reviewed: '#6b35a4', revision: '#b8860b', accepted: '#2d7a4f', rejected: '#b94040', archived: '#888'
};
const REC_COLORS = { accept: '#2d7a4f', minor_revision: '#b8860b', major_revision: '#c4611a', reject: '#b94040' };

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getAnalytics().then(r => setData(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="page-body"><div className="spinner" /></div>;
  if (!data) return <div className="page-body"><div className="alert alert-error">Failed to load analytics.</div></div>;

  const statusData = data.byStatus.map(s => ({ name: s.status.replace(/_/g, ' '), value: s.count, fill: STATUS_COLORS[s.status] || '#888' }));
  const trackData = data.byTrack.map(t => ({ name: t.name || 'Unassigned', papers: t.count }));
  const recData = data.recommendationDist.map(r => ({ name: r.recommendation.replace(/_/g, ' '), value: r.count, fill: REC_COLORS[r.recommendation] || '#888' }));

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h1>Admin Dashboard</h1><p>Full overview of the conference submission system.</p></div>
        <Link to="/all-papers" className="btn btn-gold">View All Papers</Link>
      </div>

      {/* Top Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Submissions', value: data.totalPapers, color: '#1e3356', bg: '#eaf0fb', icon: FileText },
          { label: 'Pending Reviews', value: data.pendingReviews, color: '#c4611a', bg: '#fef4ec', icon: Clock },
          { label: 'Reviews Submitted', value: data.totalReviews, color: '#2d7a4f', bg: '#e8f5ee', icon: CheckCircle },
          { label: 'Avg. Review Score', value: data.avgScore, color: '#6b35a4', bg: '#f0e8fa', icon: Star },
          { label: 'Accepted Papers', value: data.byStatus.find(s => s.status === 'accepted')?.count || 0, color: '#2d7a4f', bg: '#e8f5ee', icon: TrendingUp },
          { label: 'Active Reviewers', value: data.reviewerLoad.length, color: '#2455a4', bg: '#ddeeff', icon: Users },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg }}><Icon size={16} style={{ color }} /></div>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-header"><h2>Submissions by Status</h2></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Papers by Track</h2></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trackData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="papers" fill="var(--navy)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-header"><h2>Monthly Submissions</h2></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlySubmissions} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="var(--gold)" strokeWidth={2} dot={{ fill: 'var(--navy)', r: 4 }} name="Submissions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Review Recommendations</h2></div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={recData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {recData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Reviewer Workload */}
      <div className="card mb-3">
        <div className="card-header"><h2>Reviewer Workload</h2></div>
        <div className="table-wrap">
          {data.reviewerLoad.length === 0 ? (
            <div className="empty-state"><Users /><p>No reviewer data yet.</p></div>
          ) : (
            <table>
              <thead><tr><th>Reviewer</th><th>Assigned</th><th>Completed</th><th>Completion Rate</th></tr></thead>
              <tbody>
                {data.reviewerLoad.map((r, i) => {
                  const rate = r.assigned > 0 ? Math.round((r.completed / r.assigned) * 100) : 0;
                  return (
                    <tr key={i}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.assigned}</td>
                      <td>{r.completed}</td>
                      <td>
                        <div className="score-bar">
                          <div className="score-bar-track" style={{ height: 8 }}>
                            <div className="score-bar-fill" style={{ width: `${rate}%`, background: rate > 70 ? 'var(--green)' : rate > 40 ? 'var(--gold)' : 'var(--red)' }} />
                          </div>
                          <span className="score-val">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Papers */}
      <div className="card">
        <div className="card-header">
          <h2>Recent Submissions</h2>
          <Link to="/all-papers" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>View all →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Author</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.recentPapers.map(p => (
                <tr key={p.id}>
                  <td style={{ maxWidth: 280 }}><div style={{ fontWeight: 500 }}>{p.title}</div></td>
                  <td>{p.author_name}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(p.submission_date).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status.replace(/_/g, ' ')}</span></td>
                  <td><Link to={`/paper/${p.id}`} className="btn btn-outline btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
