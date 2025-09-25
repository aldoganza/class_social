import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function StoriesBar() {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [grouped, setGrouped] = useState([]) // [{ user_id, name, profile_pic, items: [stories...] }]
  const [error, setError] = useState('')
  const [showPlayer, setShowPlayer] = useState(null) // story to show
  const [likeBusy, setLikeBusy] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [viewers, setViewers] = useState([])
  const [viewersOpen, setViewersOpen] = useState(false)

  const load = async () => {
    try {
      const data = await api.get('/stories')
      setStories(data)
      // group by user
      const byUser = {}
      for (const s of data) {
        if (!byUser[s.user_id]) byUser[s.user_id] = { user_id: s.user_id, name: s.name, profile_pic: s.profile_pic, items: [] }
        byUser[s.user_id].items.push(s)
      }
      setGrouped(Object.values(byUser))
    } catch (e) { setError(e.message) }
  }

  const deleteStory = async (storyId) => {
    try {
      await api.del(`/stories/${storyId}`)
      setShowPlayer(null)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { load() }, [])

  // Creation moved to /create page

  const openUserStories = (userGroup) => {
    setShowPlayer({ group: userGroup, index: 0 })
  }

  const nextStory = () => {
    setShowPlayer((sp) => {
      if (!sp) return sp
      const next = sp.index + 1
      if (next < sp.group.items.length) return { ...sp, index: next }
      return null // close when finished
    })
  }

  const prevStory = () => {
    setShowPlayer((sp) => {
      if (!sp) return sp
      const prev = sp.index - 1
      if (prev >= 0) return { ...sp, index: prev }
      return sp
    })
  }

  const currentStory = showPlayer ? showPlayer.group.items[showPlayer.index] : null

  // Mark view when a story becomes current
  useEffect(() => {
    const markView = async () => {
      try {
        if (currentStory) {
          const res = await api.post(`/stories/${currentStory.id}/view`, {})
          // update views_count locally
          const copy = { ...currentStory, views_count: res.views_count }
          showPlayer.group.items[showPlayer.index] = copy
          setShowPlayer({ ...showPlayer })
        }
      } catch {}
    }
    markView()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPlayer?.index])

  const toggleLike = async () => {
    if (!currentStory || likeBusy) return
    setLikeBusy(true)
    try {
      if (currentStory.liked_by_me) {
        const res = await api.del(`/stories/${currentStory.id}/like`)
        currentStory.liked_by_me = false
        currentStory.likes_count = res.likes_count
      } else {
        const res = await api.post(`/stories/${currentStory.id}/like`, {})
        currentStory.liked_by_me = true
        currentStory.likes_count = res.likes_count
      }
      setShowPlayer({ ...showPlayer })
    } catch (e) {
      setError(e.message)
    } finally {
      setLikeBusy(false)
    }
  }

  const sendReply = async () => {
    try {
      if (!replyText.trim()) return
      const ownerId = showPlayer.group.user_id
      await api.post(`/messages/${ownerId}`, { content: replyText.trim() })
      setReplyText('')
    } catch (e) {
      setError(e.message)
    }
  }

  const openViewers = async () => {
    try {
      const list = await api.get(`/stories/${currentStory.id}/viewers`)
      setViewers(list)
      setViewersOpen(true)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="stories-bar card">
      {error && <div className="error">{error}</div>}
      {/* Story creation moved to Sidebar -> /create */}

      <div className="stories-strip">
        {grouped.map(g => (
          <button key={g.user_id} className="story" onClick={() => openUserStories(g)}>
            <span className="story-ring">
              <img src={g.profile_pic || 'https://via.placeholder.com/64'} alt={g.name} />
            </span>
            <span className="small bold" title={g.name}>{(g.name || '').slice(0,14)}</span>
          </button>
        ))}
        {grouped.length === 0 && <div className="muted small">No stories yet.</div>}
      </div>

      {currentStory && (
        <div className="modal" onClick={() => setShowPlayer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row between" style={{marginBottom:8}}>
              <div className="row gap" style={{alignItems:'center'}}>
                <span className="story-ring sm"><img src={showPlayer.group.profile_pic || 'https://via.placeholder.com/40'} /></span>
                <div className="bold">{showPlayer.group.name}</div>
              </div>
              <div className="row gap">
                {user && currentStory.user_id === user.id && (
                  <button className="btn btn-danger" onClick={() => deleteStory(currentStory.id)}>Delete</button>
                )}
                <button className="icon-btn" title="Close" aria-label="Close" onClick={() => setShowPlayer(null)}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="story-media">
              {currentStory.media_type === 'video' ? (
                <video
                  src={currentStory.media_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{maxWidth:'90vw', maxHeight:'80vh'}}
                />
              ) : (
                <div>
                  <img src={currentStory.media_url} alt="story" style={{maxWidth:'90vw', maxHeight:'80vh'}} />
                  {currentStory.audio_url && <audio src={currentStory.audio_url} controls autoPlay style={{width:'100%', marginTop:8}} />}
                </div>
              )}
              {/* Overlays: like (left) and views (right for owner) */}
              <div className="media-overlay left">
                <button className={`icon-btn ${currentStory.liked_by_me ? 'active' : ''}`} onClick={toggleLike} disabled={likeBusy} aria-label="Like story">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {currentStory.liked_by_me ? (
                      <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z" fill="currentColor" />
                    ) : (
                      <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z" />
                    )}
                  </svg>
                </button>
                <span className="pill small">{Number(currentStory.likes_count || 0)}</span>
              </div>
              {user && currentStory.user_id === user.id && (
                <div className="media-overlay right">
                  <span className="pill small" title="Views">{Number(currentStory.views_count || 0)}</span>
                </div>
              )}
            </div>
            {/* Owner-only viewers button below media */}
            {user && currentStory.user_id === user.id && (
              <div className="row end" style={{marginTop:6}}>
                <button className="btn btn-light" onClick={openViewers} aria-label="See viewers">Viewers</button>
              </div>
            )}

            {/* Reply box (small input) */}
            <div className="row gap" style={{marginTop:6}}>
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to story..."
                aria-label="Reply to story"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                className="input-compact"
                style={{flex:1}}
              />
              <button className="btn btn-primary" onClick={sendReply}>Send</button>
            </div>

            {/* Viewers list for owner */}
            {viewersOpen && user && currentStory.user_id === user.id && (
              <div className="card" style={{marginTop:10}}>
                <div className="row between" style={{marginBottom:6}}>
                  <div className="bold">Viewers ({viewers.length})</div>
                  <button className="btn btn-light" onClick={() => setViewersOpen(false)}>Close</button>
                </div>
                <div className="list" style={{maxHeight:220, overflow:'auto'}}>
                  {viewers.map(v => (
                    <div key={v.id} className="list-item">
                      <img src={v.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
                      <div className="bold small">{v.name}</div>
                    </div>
                  ))}
                  {viewers.length === 0 && <div className="muted small">No viewers yet.</div>}
                </div>
              </div>
            )}
            <div className="row between" style={{marginTop:8}}>
              <button className="btn btn-light" onClick={prevStory} disabled={showPlayer.index===0}>Prev</button>
              <div className="muted small">{showPlayer.index+1} / {showPlayer.group.items.length}</div>
              <button className="btn btn-light" onClick={nextStory} disabled={showPlayer.index===showPlayer.group.items.length-1}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
