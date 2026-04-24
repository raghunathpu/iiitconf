import { useState, useEffect } from 'react';
import { getUsers, toggleUser, changeRole } from '../../services/api';
import { Search, Shield, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = () => {
    setLoading(true);
    getUsers({ search, role: roleFilter }).then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  const handleToggle = async (id) => {
    try { await toggleUser(id); toast.success('User status updated.'); load(); }
    catch { toast.error('Failed.'); }
  };

  const handleRole = async (id, role) => {
    try { await changeRole(id, role); toast.success('Role updated.'); load(); }
    catch { toast.error('Failed.'); }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h1>User Management</h1><p>Manage all registered users and their roles.</p></div>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 32 }} placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="author">Author</option>
          <option value="reviewer">Reviewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="spinner" /> : (
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Institution</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>#{u.id}</td>
                    <td><strong style={{ fontSize: '0.88rem' }}>{u.name}</strong></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <select className="form-control" style={{ padding: '4px 8px', fontSize: '0.78rem', width: 110 }}
                        value={u.role} onChange={e => handleRole(u.id, e.target.value)}>
                        <option value="author">Author</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{u.institution || '—'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600,
                        color: u.is_active ? 'var(--green)' : 'var(--red)' }}>
                        {u.is_active ? <UserCheck size={12}/> : <UserX size={12}/>}
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : ''}`}
                        style={!u.is_active ? { background: 'var(--green-light)', color: 'var(--green)', border: '1px solid #b8dfc9' } : {}}
                        onClick={() => handleToggle(u.id)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
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
