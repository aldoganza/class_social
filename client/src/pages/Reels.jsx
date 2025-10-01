import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Reels() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [video, setVideo] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const rows = await api.get('/reels')
      setList(rows)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const onVideo = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setVideo(f)
  }

  const postReel = async () => {
    if (!video) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('video', video)
      if (caption && caption.trim()) fd.append('caption', caption.trim())
      await api.postForm('/reels', fd)
      setVideo(null); setCaption('')
      await load()
    } catch (e) {
      setError(e.message)
    } finally { setUploading(false) }
  }

  const deleteReel = async (id) => {
    try {
      await api.del(`/reels/${id}`)
      await load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="page">
      <div className="card">
        <h2 className="title">Reels</h2>
        {error && <div className="error">{error}</div>}
        {/* Upload */}
        <div className="col" style={{gap:8}}>
          <div className="row gap" style={{alignItems:'center'}}>
            <label className="btn btn-light" htmlFor="reel-video">Choose video</label>
            <input id="reel-video" type="file" accept="video/*" onChange={onVideo} style={{display:'none'}} />
            <input value={caption} onChange={(e)=>setCaption(e.target.value)} placeholder="Caption (optional)" style={{flex:1}} />
            <button className="btn btn-primary" onClick={postReel} disabled={!video || uploading}>{uploading ? 'Uploading...' : 'Post Reel'}</button>
          </div>
          {video && <span className="small muted">Selected: {video.name}</span>}
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <h3 style={{marginTop:0}}>Latest</h3>
        {loading ? (
          <div className="muted">Loading...</div>
        ) : (
          <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12}}>
            {list.map(r => (
              <div key={r.id} className="reel-item" style={{border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', display:'flex', flexDirection:'column'}}>
                <video src={r.video_url} controls style={{width:'100%', height:320, objectFit:'cover', background:'#000'}} />
                <div className="row between" style={{padding:8, alignItems:'center'}}>
                  <div className="row gap" style={{alignItems:'center'}}>
                    <img src={r.profile_pic || 'https://via.placeholder.com/28'} className="avatar" />
                    <div className="small bold">{r.name}</div>
                  </div>
                  {user && user.id === r.user_id && (
                    <button className="btn btn-light" onClick={()=>deleteReel(r.id)}>Delete</button>
                  )}
                </div>
                {r.caption && <div className="small" style={{padding:'0 8px 8px 8px'}}>{r.caption}</div>}
              </div>
            ))}
            {list.length === 0 && <div className="muted">No reels yet.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
