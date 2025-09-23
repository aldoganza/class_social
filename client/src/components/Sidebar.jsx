import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [notifUnread, setNotifUnread] = useState(0)

  useEffect(() => {
    let timer
    async function fetchUnread() {
      if (!user) { setUnread(0); return }
      try {
        const res = await api.get('/messages/me/unread/count')
        setUnread(res.count || 0)
      } catch {}
    }
    fetchUnread()
    if (user) timer = setInterval(fetchUnread, 10000)
    const onRefresh = () => { fetchUnread() }
    window.addEventListener('refresh-unread', onRefresh)
    return () => {
      if (timer) clearInterval(timer)
      window.removeEventListener('refresh-unread', onRefresh)
    }
  }, [user])

  useEffect(() => {
    let timer
    async function fetchNotifUnread() {
      if (!user) { setNotifUnread(0); return }
      try {
        const res = await api.get('/notifications/unread/count')
        setNotifUnread(res.count || 0)
      } catch {}
    }
    fetchNotifUnread()
    if (user) timer = setInterval(fetchNotifUnread, 10000)
    const onRefresh = () => { fetchNotifUnread() }
    window.addEventListener('refresh-notifications', onRefresh)
    return () => {
      if (timer) clearInterval(timer)
      window.removeEventListener('refresh-notifications', onRefresh)
    }
  }, [user])

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  const link = (to, label, icon, extraRight=null, options={}) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/')
    const withBadge = options.withBadge
    return (
      <Link to={to} className={`side-link ${active ? 'active' : ''}`}>
        <div className="row gap" style={{alignItems:'center'}}>
          <span className="icon-wrap">{icon}
            {withBadge === 'messages' && unread > 0 && (
              <span className="badge icon-badge">{unread > 99 ? '99+' : unread}</span>
            )}
            {withBadge === 'notifications' && notifUnread > 0 && (
              <span className="badge icon-badge">{notifUnread > 99 ? '99+' : notifUnread}</span>
            )}
          </span>
          <span>{label}</span>
        </div>
        {extraRight}
      </Link>
    )
  }

  return (
    <aside className="sidebar">
      <div className="side-header">
        <Link to="/" className="logo">🎓 Classmates</Link>
      </div>
      <nav className="side-nav">
        {user && link('/', 'Home', <span className="icon">🏠</span>)}
        {user && link('/search', 'Search', <span className="icon">🔍</span>)}
        {user && link('/chat', 'Messages', <span className="icon">💬</span>, null, { withBadge: 'messages' })}
        {user && link('/notifications', 'Notifications', <span className="icon">🔔</span>, null, { withBadge: 'notifications' })}
        {user && link(`/profile/${user.id}`, 'Profile', <span className="icon">👤</span>)}
      </nav>
      <div className="side-footer">
        {user ? (
          <div className="row gap">
            <img src={user.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
            <div className="col">
              <div className="bold small">{user.name}</div>
              <div className="muted small">{user.email}</div>
            </div>
            <button onClick={onLogout} className="btn btn-light">Logout</button>
          </div>
        ) : (
          <div className="row gap">
            <Link to="/login" className="btn btn-light">Login</Link>
            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
          </div>
        )}
      </div>
    </aside>
  )
}
