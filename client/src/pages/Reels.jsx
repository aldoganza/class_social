import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Reels() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewer, setViewer] = useState(null) // selected reel for modal

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

  const deleteReel = async (id) => {
    try {
      await api.del(`/reels/${id}`)
      await load()
    } catch (e) { setError(e.message) }
  }

  // Close viewer on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setViewer(null)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="page">
      <div className="card">
        {loading ? (
          <div className="muted">Loading...</div>
        ) : (
          <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill, 260px)', justifyContent:'center', gap:12}}>
            {list.map(r => (
              <div key={r.id} className="reel-item" style={{border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', display:'flex', flexDirection:'column', width:260, height:560, cursor:'pointer'}} onClick={()=>setViewer(r)}>
                <div style={{width:'100%', height:460, background:'#000'}}>
                  <video src={r.video_url} controls style={{width:'100%', height:'100%', objectFit:'cover', display:'block', background:'#000'}} />
                </div>
                <div className="row between" style={{padding:8, alignItems:'center', minHeight:44}}>
                  <div className="row gap" style={{alignItems:'center'}}>
                    <img src={r.profile_pic || 'https://via.placeholder.com/28'} className="avatar" />
                    <div className="small bold">{r.name}</div>
                  </div>
                  {user && user.id === r.user_id && (
                    <button className="btn btn-light" onClick={(e)=>{e.stopPropagation(); deleteReel(r.id)}}>Delete</button>
                  )}
                </div>
                {r.caption && (
                  <div className="small" style={{padding:'0 8px 8px 8px', height:44, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>
                    {r.caption}
                  </div>
                )}
              </div>
            ))}
            {list.length === 0 && <div className="muted">No reels yet.</div>}
          </div>
        )}
      </div>

      {viewer && (
        <div className="modal" onClick={()=>setViewer(null)}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()} style={{width:360, maxWidth:'90vw', padding:0, overflow:'hidden'}}>
            <div className="row between" style={{padding:'8px 10px', alignItems:'center', borderBottom:'1px solid var(--border)'}}>
              <div className="row gap" style={{alignItems:'center'}}>
              </div>
              <button className="icon-btn" aria-label="Close" title="Close" onClick={()=>setViewer(null)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div style={{ background: '#000' }}>
              <video src={viewer.video_url} controls autoPlay style={{width:'100%', height:640, objectFit:'cover', display:'block'}} />
            </div>
            {viewer.caption && <div className="small" style={{padding:10}}>{viewer.caption}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
