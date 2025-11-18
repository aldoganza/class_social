import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function MobileNav() {
  const { user } = useAuth()
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

  const navItem = (to, label, icon, badgeCount = 0) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/')
    return (
      <Link to={to} className={`mobile-nav-item ${active ? 'active' : ''}`}>
        <div style={{ position: 'relative' }}>
          <span className="icon">{icon}</span>
          {badgeCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              background: '#ff3040',
              color: 'white',
              borderRadius: '10px',
              fontSize: '9px',
              fontWeight: 'bold',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </div>
        <span className="label">{label}</span>
      </Link>
    )
  }

  if (!user) return null

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        {navItem('/', 'Home', <HomeIcon />)}
        {navItem('/search', 'Search', <SearchIcon />)}
        {navItem('/chat', 'Messages', <MessageIcon />, unread)}
        {navItem('/groups', 'Groups', <GroupsIcon />)}
        {navItem('/create', 'Create', <CreateIcon />)}
        {navItem(`/profile/${user.id}`, 'Profile', <UserIcon />)}
      </div>
    </nav>
  )
}

// SVG Icon Components
function SvgBase({ children, size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
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
      <path d="M21 11.5c0 4.418-4.03 8-9 8-1.36 0-2.64-.25-3.8-.7L4 21l1.2-3.1A8.72 8.72 0 0 1 3 11.5C3 7.082 7.03 3.5 12 3.5s9 3.582 9 8z" />
      <path d="M8.5 12.5l3-2 2 2 2.5-2" />
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

function ReelsIcon() {
  return (
    <SvgBase>
      <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
      <polygon points="10,8 16,12 10,16" />
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

function GroupsIcon() {
  return (
    <SvgBase>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </SvgBase>
  )
}
