import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  
  // Check for success message from password reset
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
    }
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login(email, password)
    if (res.ok) navigate(from, { replace: true })
    else setError(res.error)
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-brand">
          <div className="brand-content">
            <h1 className="brand-title gradient-text">🎓 Classmates</h1>
            <p className="brand-subtitle">Connect, Share, and Collaborate with Your Classmates</p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <span>Real-time Messaging</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span>Study Groups</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📚</span>
                <span>Share Resources</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-container">
          <div className="card auth-card">
            <div className="auth-header">
              <h2 className="auth-title">Welcome Back!</h2>
              <p className="auth-subtitle">Log in to see what's happening</p>
            </div>

            {successMessage && (
              <div className="alert alert-success">
                <span>✅</span>
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="form auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="link-primary" style={{fontSize:'0.875rem'}}>
                    Forgot password?
                  </Link>
                </div>
                <input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Logging in...</span>
                  </>
                ) : (
                  'Log In'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p className="text-center muted">
                Don't have an account? <Link to="/signup" className="link-primary">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
