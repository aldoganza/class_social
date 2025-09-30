import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api'

export default function Settings() {
  const { theme, toggleTheme, setTheme } = useTheme()
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(user?.profile_pic || '')
  const [saved, setSaved] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Settings (more options)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [privacyPrivate, setPrivacyPrivate] = useState(false)
  const [messagesFollowersOnly, setMessagesFollowersOnly] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [settingsSaved, setSettingsSaved] = useState('')
  const [settingsError, setSettingsError] = useState('')

  // Change password
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  // Load existing settings
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingSettings(true)
        const s = await api.get('/users/me/settings')
        if (!mounted) return
        setPrivacyPrivate(!!s.privacy_private)
        setMessagesFollowersOnly(!!s.messages_followers_only)
        setEmailNotifications(!!s.email_notifications)
      } catch (e) {
        setSettingsError(e.message || 'Failed to load settings')
      } finally {
        setLoadingSettings(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const saveSettings = async () => {
    try {
      setSettingsError('')
      setSettingsSaved('')
      await api.patch('/users/me/settings', {
        privacy_private: privacyPrivate ? 1 : 0,
        messages_followers_only: messagesFollowersOnly ? 1 : 0,
        email_notifications: emailNotifications ? 1 : 0,
      })
      setSettingsSaved('Saved')
      setTimeout(() => setSettingsSaved(''), 1200)
    } catch (e) {
      setSettingsError(e.message || 'Failed to save settings')
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwMsg('')
    if (!curPass || !newPass) { setPwMsg('Please fill both fields'); return }
    if (newPass !== newPass2) { setPwMsg('Passwords do not match'); return }
    setPwSaving(true)
    try {
      await api.patch('/auth/password', { current_password: curPass, new_password: newPass })
      setPwMsg('Password changed')
      setCurPass(''); setNewPass(''); setNewPass2('')
    } catch (e) {
      setPwMsg(e.message || 'Failed to change password')
    } finally { setPwSaving(false) }
  }

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
          <h3>Privacy</h3>
          {settingsError && <div className="error" style={{marginBottom:8}}>{settingsError}</div>}
          <div className="col" style={{gap:10}}>
            <label className="row between" style={{alignItems:'center'}}>
              <span>Private account</span>
              <input type="checkbox" checked={privacyPrivate} onChange={(e)=>setPrivacyPrivate(e.target.checked)} />
            </label>
            <label className="row between" style={{alignItems:'center'}}>
              <span>Allow messages from followers only</span>
              <input type="checkbox" checked={messagesFollowersOnly} onChange={(e)=>setMessagesFollowersOnly(e.target.checked)} />
            </label>
            <div className="row end" style={{gap:8}}>
              <button className="btn btn-primary" onClick={saveSettings} disabled={loadingSettings}>Save Privacy</button>
              {settingsSaved && <span className="muted small">{settingsSaved}</span>}
            </div>
          </div>
        </div>

        <div className="section" style={{marginTop:16}}>
          <h3>Notifications</h3>
          <div className="row between" style={{alignItems:'center'}}>
            <span>Email notifications</span>
            <input type="checkbox" checked={emailNotifications} onChange={(e)=>setEmailNotifications(e.target.checked)} />
          </div>
          <div className="row end" style={{gap:8, marginTop:8}}>
            <button className="btn btn-primary" onClick={saveSettings}>Save Notifications</button>
            {settingsSaved && <span className="muted small">{settingsSaved}</span>}
          </div>
        </div>

        <div className="section" style={{marginTop:16}}>
          <h3>Change password</h3>
          <form onSubmit={changePassword} className="form col" style={{gap:8}}>
            <label className="small">Current password</label>
            <input type="password" value={curPass} onChange={(e)=>setCurPass(e.target.value)} placeholder="Current password" />
            <label className="small">New password</label>
            <input type="password" value={newPass} onChange={(e)=>setNewPass(e.target.value)} placeholder="New password" />
            <label className="small">Confirm new password</label>
            <input type="password" value={newPass2} onChange={(e)=>setNewPass2(e.target.value)} placeholder="Confirm new password" />
            <div className="row gap end">
              <button className="btn btn-primary" disabled={pwSaving}>{pwSaving? 'Saving...' : 'Change password'}</button>
              {pwMsg && <span className="muted small">{pwMsg}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
