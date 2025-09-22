import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let timer
    async function fetchUnread() {
      if (!user) { setUnread(0); return }
      try {
        const res = await api.get('/messages/me/unread/count')
        setUnread(res.count || 0)
      } catch (e) {
        // ignore errors silently in navbar
      }
    }
    fetchUnread()
    if (user) {
      timer = setInterval(fetchUnread, 10000) // poll every 10s
    }
    // Listen to explicit refresh events from Chat
    const onRefresh = () => { fetchUnread() }
    window.addEventListener('refresh-unread', onRefresh)
    return () => {
      if (timer) clearInterval(timer)
      window.removeEventListener('refresh-unread', onRefresh)
    }
  }, [user])

  const onLogout = () => {
    logout()
    navigate('/login')
  }
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo">🎓 Classmates</Link>
        {user && <Link to="/" className="nav-link">Home</Link>}
        {user && <Link to={`/profile/${user.id}`} className="nav-link">Profile</Link>}
        {user && (
          <Link to="/chat" className="nav-link badge-wrap">
            Messages
            {unread > 0 && <span className="badge">{unread > 99 ? '99+' : unread}</span>}
          </Link>
        )}
      </div>
      <div className="nav-right">
        {!user && <Link to="/login" className="btn btn-light">Login</Link>}
        {!user && <Link to="/signup" className="btn btn-primary">Sign Up</Link>}
        {user && (
          <div className="row gap">
            <img src={user.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
            <span className="muted">{user.name}</span>
            <button onClick={onLogout} className="btn btn-light">Logout</button>
          </div>
        )}
      </div>
    </nav>
  )
}
