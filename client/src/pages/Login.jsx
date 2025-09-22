import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login(email, password)
    if (res.ok) navigate(from, { replace: true })
    else setError(res.error)
  }

  return (
    <div className="auth-wrapper">
      <div className="card">
        <h1 className="title">Welcome back!</h1>
        <p className="subtitle">Log in to see your classmates' posts</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit} className="form">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />

          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="muted">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
