import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-brand">
            {/* Animated Background Particles */}
            <div className="particles">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${15 + Math.random() * 10}s`
                  }}
                />
              ))}
            </div>
            <div className="brand-content">
              <h1 className="brand-title gradient-text">🎓 Classmates</h1>
              <p className="brand-subtitle">Connect, Share, and Collaborate with Your Classmates</p>
            </div>
          </div>

          <div className="auth-form-container">
            <div className="card auth-card">
              <div className="auth-header">
                <div style={{textAlign:'center', marginBottom:20}}>
                  <span style={{fontSize:48}}>✅</span>
                </div>
                <h2 className="auth-title">Check Your Email</h2>
                <p className="auth-subtitle">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
              </div>

              <div className="alert alert-info" style={{marginTop:20}}>
                <span>ℹ️</span>
                <span>If you don't see the email, check your spam folder.</span>
              </div>

              <div className="auth-footer" style={{marginTop:20}}>
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

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-brand">
          {/* Animated Background Particles */}
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>
          <div className="brand-content">
            <h1 className="brand-title gradient-text">🎓 Classmates</h1>
            <p className="brand-subtitle">Connect, Share, and Collaborate with Your Classmates</p>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="card auth-card">
            <div className="auth-header">
              <h2 className="auth-title">Forgot Password?</h2>
              <p className="auth-subtitle">
                No worries! Enter your email and we'll send you reset instructions.
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

              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Sending...</span>
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p className="text-center muted">
                Remember your password? <Link to="/login" className="link-primary">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
