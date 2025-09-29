import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Settings() {
  const { theme, toggleTheme, setTheme } = useTheme()
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saved, setSaved] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  const onSelectTheme = (v) => setTheme(v)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // TODO: Connect to backend if you want profile edits here.
      await new Promise(r => setTimeout(r, 600))
      setSaved('Saved')
      setTimeout(() => setSaved(''), 1200)
    } finally { setSaving(false) }
  }

  return (
    <div className="page">
      <div className="card">
        <h2 style={{marginTop:0}}>Settings</h2>

        <div className="section">
          <h3>Appearance</h3>
          <div className="row gap" style={{alignItems:'center'}}>
            <label className={`pill ${theme==='dark'?'btn-primary':'btn-light'}`} style={{cursor:'pointer'}}>
              <input type="radio" name="theme" value="dark" checked={theme==='dark'} onChange={() => onSelectTheme('dark')} style={{display:'none'}} />
              Dark (default)
            </label>
            <label className={`pill ${theme==='light'?'btn-primary':'btn-light'}`} style={{cursor:'pointer'}}>
              <input type="radio" name="theme" value="light" checked={theme==='light'} onChange={() => onSelectTheme('light')} style={{display:'none'}} />
              Light
            </label>
            <button className="btn btn-light" onClick={toggleTheme}>Toggle</button>
          </div>
        </div>

        <div className="section" style={{marginTop:16}}>
          <h3>Profile (demo)</h3>
          <form onSubmit={saveProfile} className="form col" style={{gap:8}}>
            <label className="small">Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
            <label className="small">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Your email" />
            <div className="row gap end">
              <button className="btn btn-primary" disabled={saving}>{saving? 'Saving...' : 'Save'}</button>
              {saved && <span className="muted small">{saved}</span>}
            </div>
          </form>
        </div>

        <div className="section" style={{marginTop:16}}>
          <h3>More options</h3>
          <ul className="small">
            <li>Change password (coming soon)</li>
            <li>Privacy controls (coming soon)</li>
            <li>Notification preferences (coming soon)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
