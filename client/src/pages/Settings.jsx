import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api'

export default function Settings() {
  const { theme, toggleTheme, setTheme } = useTheme()
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(user?.profile_pic || '')
  const [saved, setSaved] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  const onSelectTheme = (v) => setTheme(v)

  const onPickPhoto = (e) => {
    const f = e.target.files && e.target.files[0]
    setPhotoFile(f || null)
    if (f) setPhotoPreview(URL.createObjectURL(f))
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const form = new FormData()
      if (name && name !== user?.name) form.append('name', name)
      if (photoFile) form.append('profile_pic', photoFile)
      if ([...form.keys()].length === 0) {
        setSaved('No changes')
        setTimeout(() => setSaved(''), 1200)
        return
      }
      const updated = await api.patchForm('/users/me', form)
      setUser(updated)
      setSaved('Saved')
      setTimeout(() => setSaved(''), 1200)
    } catch (e) {
      setError(e.message || 'Failed to update profile')
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
          <h3>Profile</h3>
          {error && <div className="error" style={{marginBottom:8}}>{error}</div>}
          <form onSubmit={saveProfile} className="form col" style={{gap:10}}>
            <div className="row gap" style={{alignItems:'center'}}>
              <img src={photoPreview || 'https://via.placeholder.com/80'} alt="Preview" className="avatar" style={{width:64, height:64, borderRadius:12, objectFit:'cover'}} />
              <label className="btn btn-light" htmlFor="profile-pic-input">Change Photo</label>
              <input id="profile-pic-input" type="file" accept="image/*" onChange={onPickPhoto} style={{display:'none'}} />
            </div>
            <label className="small">Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
            <label className="small">Email</label>
            <input value={email} readOnly disabled />
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
