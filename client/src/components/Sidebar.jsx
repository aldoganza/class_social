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
        {user && link('/', 'Home', <HomeIcon />)}
        {user && link('/search', 'Search', <SearchIcon />)}
        {user && link('/chat', 'Messages', <MessageIcon />, null, { withBadge: 'messages' })}
        {user && link('/create', 'Create', <CreateIcon />)}
        {user && link('/notifications', 'Notifications', <HeartIcon />, null, { withBadge: 'notifications' })}
        {user && link(`/profile/${user.id}`, 'Profile', <UserIcon />)}
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

function SvgBase({ children }) {
  return (
    <span className="icon" aria-hidden>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  )
}

function HomeIcon() {
  return (
    <SvgBase>
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" />
    </SvgBase>
  )
}

function SearchIcon() {
  return (
    <SvgBase>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </SvgBase>
  )
}

function MessageIcon() {
  return (
    <SvgBase>
      {/* Chat bubble outline */}
      <path d="M21 11.5c0 4.418-4.03 8-9 8-1.36 0-2.64-.25-3.8-.7L4 21l1.2-3.1A8.72 8.72 0 0 1 3 11.5C3 7.082 7.03 3.5 12 3.5s9 3.582 9 8z" />
      {/* Zigzag mark inside */}
      <path d="M8.5 12.5l3-2 2 2 2.5-2" />
    </SvgBase>
  )
}

function HeartIcon() {
  return (
    <SvgBase>
      <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z" />
    </SvgBase>
  )
}

function UserIcon() {
  return (
    <SvgBase>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" />
    </SvgBase>
  )
}

function CreateIcon() {
  return (
    <SvgBase>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <line x1="12" y1="7" x2="12" y2="17" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </SvgBase>
  )
}
