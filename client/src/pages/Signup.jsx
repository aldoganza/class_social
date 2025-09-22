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
      <div className="card">
        <h1 className="title">Join Classmates Social</h1>
        <p className="subtitle">Make friends. Share moments. Chat with classmates.</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit} className="form">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />

          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />

          <label>Profile picture (optional)</label>
          <input type="file" accept="image/*" onChange={onPickFile} />
          {preview && (
            <div className="row gap">
              <img src={preview} alt="preview" className="avatar-lg" />
              <span className="muted small">Preview</span>
            </div>
          )}

          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing up...' : 'Create Account'}
          </button>
        </form>
        <p className="muted">
          Have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
