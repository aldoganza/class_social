import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!token) {
      setError('Invalid or missing reset token')
      return
    }

    setLoading(true)
    
    try {
      await api.post('/auth/reset-password', { token, password })
      navigate('/login', { 
        state: { message: 'Password reset successful! Please log in with your new password.' }
      })
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="brand-content">
            <h1 className="brand-title gradient-text">🎓 Classmates</h1>
            <p className="brand-subtitle">Connect, Share, and Collaborate with Your Classmates</p>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="card auth-card">
            <div className="auth-header">
              <h2 className="auth-title">Reset Your Password</h2>
              <p className="auth-subtitle">
                Enter your new password below
              </p>
            </div>

            {error && (
              <div className="alert alert-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="form auth-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input 
                  id="password"
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <small className="muted">Must be at least 6 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input 
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Resetting...</span>
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p className="text-center muted">
                <Link to="/login" className="link-primary">← Back to login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
