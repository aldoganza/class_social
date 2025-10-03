import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Reels() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mutedMap, setMutedMap] = useState({}) // {id: boolean}
  const [hearts, setHearts] = useState({}) // {id: Array<{id,size,dx,duration,delay}>}
  const [commentsOpen, setCommentsOpen] = useState(null) // reel id or null
  const [comments, setComments] = useState({}) // {id: list}
  const [newComment, setNewComment] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const rows = await api.get('/reels')
      setList(rows)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  const toggleSave = async (r) => {
    try {
      const saved = !!r.saved_by_me
      let res
      if (saved) res = await api.del(`/reels/${r.id}/save`)
      else res = await api.post(`/reels/${r.id}/save`, {})
      setList(list => list.map(x => x.id === r.id ? { ...x, saved_by_me: !saved, saves_count: res.saves_count } : x))
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { load() }, [])

  const deleteReel = async (id) => {
    try {
      await api.del(`/reels/${id}`)
      await load()
    } catch (e) { setError(e.message) }
  }

  const toggleMute = (id) => setMutedMap(m => ({ ...m, [id]: !m[id] }))

  const spawnHearts = (id, count = 6) => {
    const now = Date.now()
    const batch = Array.from({ length: count }).map((_, i) => ({
      id: now + i + Math.random(),
      size: 18 + Math.floor(Math.random() * 12),
      dx: Math.round((Math.random() * 2 - 1) * 40),
      delay: Math.floor(Math.random() * 200),
      duration: 900 + Math.floor(Math.random() * 400),
    }))
    setHearts(h => ({ ...h, [id]: [...(h[id] || []), ...batch] }))
    setTimeout(() => {
      setHearts(h => ({ ...h, [id]: (h[id] || []).filter(x => x.id < now) }))
    }, 1600)
  }

  const toggleLike = async (r) => {
    try {
      const liked = !!r.liked_by_me
      let res
      if (liked) res = await api.del(`/reels/${r.id}/like`)
      else res = await api.post(`/reels/${r.id}/like`, {})
      setList(list => list.map(x => x.id === r.id ? { ...x, liked_by_me: !liked, likes_count: res.likes_count } : x))
      if (!liked) spawnHearts(r.id, 8)
    } catch (e) { setError(e.message) }
  }

  const shareReel = async (r) => {
    try {
      const url = r.video_url || window.location.href
      await navigator.clipboard.writeText(url)
      // optional: simple toast
    } catch (e) { setError('Failed to copy link') }
  }

  const openComments = async (r) => {
    try {
      const rows = await api.get(`/reels/${r.id}/comments`)
      setComments(c => ({ ...c, [r.id]: rows }))
      setCommentsOpen(r.id)
    } catch (e) { setError(e.message) }
  }

  const addComment = async (r) => {
    const text = newComment.trim()
    if (!text) return
    try {
      const row = await api.post(`/reels/${r.id}/comments`, { content: text })
      setComments(c => ({ ...c, [r.id]: [ ...(c[r.id] || []), row ] }))
      setNewComment('')
      setList(list => list.map(x => x.id === r.id ? { ...x, comments_count: (x.comments_count || 0) + 1 } : x))
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="page" style={{display:'flex', justifyContent:'center'}}>
      <div className="col" style={{gap:24, alignItems:'center', width:'100%'}}>
        {loading && <div className="muted">Loading...</div>}
        {!loading && list.length === 0 && <div className="muted">No reels yet.</div>}
        {!loading && list.map(r => {
          const isMuted = !!mutedMap[r.id]
          return (
            <div key={r.id} style={{position:'relative', width:380, maxWidth:'calc(100vw - 120px)'}}>
              <div style={{borderRadius:16, overflow:'hidden', background:'#000'}}>
                <video
                  src={r.video_url}
                  autoPlay
                  muted={isMuted}
                  loop
                  controls={false}
                  playsInline
                  style={{width:'100%', height:600, objectFit:'cover', display:'block'}}
                />
              </div>
              <button
                className="icon-btn"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label="Toggle mute"
                onClick={()=>toggleMute(r.id)}
                style={{position:'absolute', right:12, top:12, background:'rgba(0,0,0,0.45)', borderRadius:999, padding:6}}
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15 9a3 3 0 0 1 0 6"/><path d="M19 7a7 7 0 0 1 0 10"/></svg>
                )}
              </button>
              {/* Right-side action column */}
              <div style={{position:'absolute', right:-56, top:80, display:'flex', flexDirection:'column', alignItems:'center', gap:14}}>
                <button className="icon-btn" title="Like" aria-label="Like" onClick={()=>toggleLike(r)} style={{background:'rgba(0,0,0,0.45)', borderRadius:999, padding:10}}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={r.liked_by_me ? 'red' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z"/></svg>
                </button>
                <div className="tiny" style={{color:'#fff', textAlign:'center'}}>{Number(r.likes_count || 0)}</div>
                <button className="icon-btn" title="Comments" aria-label="Comments" onClick={()=>openComments(r)} style={{background:'rgba(0,0,0,0.45)', borderRadius:999, padding:10}}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5c0 4.418-4.03 8-9 8-1.36 0-2.64-.25-3.8-.7L4 21l1.2-3.1A8.72 8.72 0 0 1 3 11.5C3 7.082 7.03 3.5 12 3.5s9 3.582 9 8z"/></svg>
                </button>
                <div className="tiny" style={{color:'#fff', textAlign:'center'}}>{Number(r.comments_count || 0)}</div>
                <button className="icon-btn" title="Share" aria-label="Share" onClick={()=>shareReel(r)} style={{background:'rgba(0,0,0,0.45)', borderRadius:999, padding:10}}>
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <polygon points="22,2 2,9 11,13 15,22 22,2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="icon-btn" title="Save" aria-label="Save" onClick={()=>toggleSave(r)} style={{background:'rgba(0,0,0,0.45)', borderRadius:999, padding:10}}>
                  {r.saved_by_me ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  )}
                </button>
                <div className="tiny" style={{color:'#fff', textAlign:'center'}}>{Number(r.saves_count || 0)}</div>
              </div>
              {/* Like heart burst */}
              {(hearts[r.id]?.length > 0) && (
                <div aria-hidden style={{position:'absolute', right: 18, bottom: 90, zIndex: 5, pointerEvents:'none'}}>
                  {hearts[r.id].map(h => (
                    <span key={h.id} style={{display:'inline-block', transform:`translateX(${h.dx}px)`, marginLeft: 4}}>
                      <span style={{display:'inline-block', animation:`likeFloat ${h.duration}ms ease-out ${h.delay}ms forwards`}}>
                        <svg viewBox="0 0 24 24" width={h.size} height={h.size} fill="red">
                          <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z"/>
                        </svg>
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <div style={{position:'absolute', left:0, right:0, bottom:0, padding:12, background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 60%)'}}>
                <div className="row gap" style={{alignItems:'center'}}>
                  <img src={r.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
                  <div className="small bold" style={{color:'#fff'}}>{r.name}</div>
                </div>
                {r.caption && (
                  <div className="small" style={{color:'#fff', marginTop:6, textShadow:'0 1px 2px rgba(0,0,0,0.5)'}}>
                    {r.caption}
                  </div>
                )}
              </div>
              {/* Comments drawer */}
              {commentsOpen === r.id && (
                <div className="card" style={{position:'absolute', right:-280, top:0, width:260, maxHeight:600, overflow:'auto'}}>
                  <div className="row between" style={{alignItems:'center'}}>
                    <div className="bold">Comments</div>
                    <button className="icon-btn" onClick={()=>setCommentsOpen(null)} aria-label="Close">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                  <div className="list" style={{marginTop:8}}>
                    {(comments[r.id] || []).map(c => (
                      <div key={c.id} className="list-item">
                        <img src={c.profile_pic || 'https://via.placeholder.com/28'} className="avatar" />
                        <div>
                          <div className="small bold">{c.name}</div>
                          <div className="small">{c.content}</div>
                        </div>
                      </div>
                    ))}
                    {(comments[r.id] || []).length === 0 && <div className="muted small">No comments yet.</div>}
                  </div>
                  <div className="row" style={{marginTop:8, gap:6}}>
                    <input value={newComment} onChange={(e)=>setNewComment(e.target.value)} placeholder="Add a comment" />
                    <button className="btn" onClick={()=>addComment(r)}>Send</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
