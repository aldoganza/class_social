import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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
        {user && <Link to="/chat" className="nav-link">Chat</Link>}
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
