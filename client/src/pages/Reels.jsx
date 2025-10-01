import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Reels() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewer, setViewer] = useState(null) // selected reel for modal
  const [isMuted, setIsMuted] = useState(true)
  const [viewerIndex, setViewerIndex] = useState(-1)

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
            {list.map((r, idx) => (
              <div key={r.id} className="reel-item" style={{border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', display:'flex', flexDirection:'column', width:260, height:560, cursor:'pointer'}} onClick={()=>{ setViewer(r); setViewerIndex(idx); setIsMuted(true) }}>
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
          <div className="modal-content" onClick={(e)=>e.stopPropagation()} style={{background:'transparent', boxShadow:'none', padding:0}}>
            <div className="row center" style={{gap:16}}>
              {/* Video column */}
              <div style={{position:'relative', width:380, maxWidth:'calc(100vw - 120px)'}}>
                <div style={{borderRadius:16, overflow:'hidden', background:'#000'}}>
                  <video
                    src={viewer.video_url}
                    autoPlay
                    muted={isMuted}
                    loop
                    controls={false}
                    playsInline
                    style={{width:'100%', height:600, objectFit:'cover', display:'block'}}
                  />
                </div>
                {/* Mute button */}
                <button
                  className="icon-btn"
                  title={isMuted ? 'Unmute' : 'Mute'}
                  aria-label="Toggle mute"
                  onClick={()=>setIsMuted(m => !m)}
                  style={{position:'absolute', right:12, top:12, background:'rgba(0,0,0,0.45)', borderRadius:999, padding:6}}
                >
                  {isMuted ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15 9a3 3 0 0 1 0 6"/><path d="M19 7a7 7 0 0 1 0 10"/></svg>
                  )}
                </button>
                {/* Bottom gradient overlay with user + caption */}
                <div style={{position:'absolute', left:0, right:0, bottom:0, padding:12, background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 60%)'}}>
                  <div className="row gap" style={{alignItems:'center'}}>
                    <img src={viewer.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
                    <div className="small bold" style={{color:'#fff'}}>{viewer.name}</div>
                    <button className="btn" style={{padding:'4px 8px'}}>Follow</button>
                  </div>
                  {viewer.caption && (
                    <div className="small" style={{color:'#fff', marginTop:6, textShadow:'0 1px 2px rgba(0,0,0,0.5)'}}>
                      {viewer.caption}
                    </div>
                  )}
                </div>
              </div>
              {/* Right-side action bar (placeholders) */}
              <div className="col" style={{alignItems:'center', gap:16}}>
                <button className="icon-btn" title="Like" aria-label="Like" style={{background:'rgba(0,0,0,0.4)', borderRadius:999, padding:10}}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z"/></svg>
                </button>
                <button className="icon-btn" title="Comment" aria-label="Comment" style={{background:'rgba(0,0,0,0.4)', borderRadius:999, padding:10}}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M21 11.5c0 4.418-4.03 8-9 8-1.36 0-2.64-.25-3.8-.7L4 21l1.2-3.1A8.72 8.72 0 0 1 3 11.5C3 7.082 7.03 3.5 12 3.5s9 3.582 9 8z"/></svg>
                </button>
                <button className="icon-btn" title="Share" aria-label="Share" style={{background:'rgba(0,0,0,0.4)', borderRadius:999, padding:10}}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M22 2 11 13 15 22 11 13 2 9 22 2"/></svg>
                </button>
                <button className="icon-btn" title="Close" aria-label="Close" onClick={()=>setViewer(null)} style={{background:'rgba(0,0,0,0.4)', borderRadius:999, padding:10}}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
