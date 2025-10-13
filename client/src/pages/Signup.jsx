import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const { signup, loading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profileFile, setProfileFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const form = new FormData()
    form.append('name', name)
    form.append('email', email)
    form.append('password', password)
    if (profileFile) form.append('profile_pic', profileFile)
    const res = await signup(form)
    if (res.ok) navigate('/')
    else setError(res.error)
  }

  const onPickFile = (e) => {
    const file = e.target.files?.[0]
    setProfileFile(file || null)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview('')
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-brand">
          <div className="brand-content">
            <h1 className="brand-title gradient-text">🎓 Classmates</h1>
            <p className="brand-subtitle">Your Campus Social Network</p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">📝</span>
                <span>Share Posts & Updates</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎥</span>
                <span>Stories & Reels</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔔</span>
                <span>Stay Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="auth-form-container">
          <div className="card auth-card">
            <div className="auth-header">
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-subtitle">Join your classmates today</p>
            </div>

            {error && (
              <div className="alert alert-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="form auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  id="name"
                  type="text"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>

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
                <label htmlFor="password">Password</label>
                <input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                  minLength="6"
                />
                <small className="form-hint">At least 6 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="profile-pic">Profile Picture (Optional)</label>
                <div className="file-upload-container">
                  <input 
                    id="profile-pic"
                    type="file" 
                    accept="image/*" 
                    onChange={onPickFile}
                    className="file-input"
                  />
                  {preview && (
                    <div className="preview-container">
                      <img src={preview} alt="preview" className="avatar-lg" />
                      <span className="muted small">Looking good! 👍</span>
                    </div>
                  )}
                </div>
              </div>

              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Creating account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p className="text-center muted">
                Already have an account? <Link to="/login" className="link-primary">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
