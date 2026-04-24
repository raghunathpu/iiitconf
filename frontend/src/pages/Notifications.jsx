import { useState, useEffect } from 'react';
import { getNotifications, markRead, markAllRead } from '../services/api';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const typeStyles = {
  success: { bg: 'var(--green-light)', color: 'var(--green)', border: '#b8dfc9' },
  error: { bg: 'var(--red-light)', color: 'var(--red)', border: '#f0c0c0' },
  warning: { bg: 'var(--orange-light)', color: 'var(--orange)', border: '#f0d0b0' },
  info: { bg: 'var(--blue-light)', color: 'var(--blue)', border: '#c0d4f0' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getNotifications().then(r => setNotifications(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRead = async (id) => {
    await markRead(id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleReadAll = async () => {
    await markAllRead();
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read.');
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unread} unread notification{unread !== 1 ? 's' : ''}.</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline" onClick={handleReadAll}>
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? <div className="spinner" /> : notifications.length === 0 ? (
        <div className="empty-state"><BellOff /><p>No notifications yet.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => {
            const style = typeStyles[n.type] || typeStyles.info;
            return (
              <div key={n.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px',
                  background: n.is_read ? '#fff' : style.bg,
                  border: `1px solid ${n.is_read ? 'var(--border)' : style.border}`,
                  borderRadius: 6, cursor: n.is_read ? 'default' : 'pointer',
                  opacity: n.is_read ? 0.75 : 1
                }}
                onClick={() => !n.is_read && handleRead(n.id)}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'transparent' : style.color, marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: '0.88rem', color: n.is_read ? 'var(--text-muted)' : 'var(--text)' }}>{n.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.is_read && (
                  <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); handleRead(n.id); }}>
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
