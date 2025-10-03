import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Reels() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mutedMap, setMutedMap] = useState({}) // {id: boolean}

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

  const toggleMute = (id) => setMutedMap(m => ({ ...m, [id]: !m[id] }))

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
              {user && user.id === r.user_id && (
                <button className="btn btn-light" onClick={()=>deleteReel(r.id)} style={{position:'absolute', left:12, top:12}}>Delete</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
