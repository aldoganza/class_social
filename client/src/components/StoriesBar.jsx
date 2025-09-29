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
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0) // 0..1 for current segment
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [following, setFollowing] = useState([])
  const [followingLoading, setFollowingLoading] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [shareText, setShareText] = useState('')

  // Simple time-ago helper
  const timeAgo = (ts) => {
    try {
      const d = new Date(ts)
      const diff = Math.max(0, Date.now() - d.getTime())
      const mins = Math.floor(diff / 60000)
      if (mins < 1) return 'now'
      if (mins < 60) return `${mins}m`
      const hrs = Math.floor(mins / 60)
      if (hrs < 24) return `${hrs}h`
      const days = Math.floor(hrs / 24)
      return `${days}d`
    } catch {
      return ''
    }
  }

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

  const openUserStories = (groupIndex) => {
    const g = grouped[groupIndex]
    if (!g) return
    setShowPlayer({ group: g, groupIndex, index: 0 })
  }

  const nextStory = () => {
    setShowPlayer((sp) => {
      if (!sp) return sp
      const next = sp.index + 1
      if (next < sp.group.items.length) return { ...sp, index: next }
      // move to next user group if exists
      const gi = typeof sp.groupIndex === 'number' ? sp.groupIndex : grouped.findIndex(g => g.user_id === sp.group.user_id)
      if (gi >= 0 && gi + 1 < grouped.length) {
        const nextGroup = grouped[gi + 1]
        return { group: nextGroup, groupIndex: gi + 1, index: 0 }
      }
      return null // close when finished with last group
    })
  }

  const prevStory = () => {
    setShowPlayer((sp) => {
      if (!sp) return sp
      const prev = sp.index - 1
      if (prev >= 0) return { ...sp, index: prev }
      // move to previous user group if exists
      const gi = typeof sp.groupIndex === 'number' ? sp.groupIndex : grouped.findIndex(g => g.user_id === sp.group.user_id)
      if (gi > 0) {
        const prevGroup = grouped[gi - 1]
        return { group: prevGroup, groupIndex: gi - 1, index: Math.max(0, (prevGroup.items?.length || 1) - 1) }
      }
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

  // Auto-advance with progress bar (longer per request)
  useEffect(() => {
    if (!currentStory) return
    setProgress(0)
    const DURATION = currentStory.media_type === 'video' ? 15000 : 12000
    const startedAt = Date.now()
    const tick = () => {
      const p = Math.min(1, (Date.now() - startedAt) / DURATION)
      setProgress(p)
      if (p >= 1) {
        nextStory()
      } else {
        raf = requestAnimationFrame(tick)
      }
    }
    let raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?.id])

  // Keyboard shortcuts while modal open
  useEffect(() => {
    if (!currentStory) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); nextStory() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prevStory() }
      else if (e.key === 'Escape') { e.preventDefault(); setShowPlayer(null) }
      else if (e.key.toLowerCase() === 'm') { e.preventDefault(); setIsMuted(m => !m) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?.id])

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
      if (!currentStory) return
      if (sending) return
      setSending(true)
      const text = replyText.trim()
      const ownerId = showPlayer.group.user_id
      if (text) {
        await api.post(`/messages/${ownerId}`, { content: text })
        setToast('Reply sent')
      } else {
        // Open share picker instead of sending directly
        await openShare()
        return
      }
      setReplyText('')
      setTimeout(() => setToast(''), 1500)
    } catch (e) {
      setError(e.message)
    } finally { setSending(false) }
  }

  const openShare = async () => {
    try {
      if (!user) return
      setFollowingLoading(true)
      const list = await api.get(`/users/${user.id}/following`)
      setFollowing(list)
      setShareOpen(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setFollowingLoading(false)
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const copy = new Set(prev)
      if (copy.has(id)) copy.delete(id); else copy.add(id)
      return copy
    })
  }

  const sendShare = async () => {
    try {
      if (!currentStory || selected.size === 0) return
      setSending(true)
      const link = `${window.location.origin}/profile/${currentStory.user_id}?story=${currentStory.id}`
      const text = shareText.trim()
      const content = text ? `${text}\n${link}` : `Check this story: ${link}`
      const ids = Array.from(selected)
      for (const id of ids) {
        await api.post(`/messages/${id}`, { content })
      }
      setToast('Shared')
      setShareOpen(false)
      setSelected(new Set())
      setShareText('')
      setTimeout(() => setToast(''), 1500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
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
        {grouped.map((g, i) => (
          <button key={g.user_id} className="story" onClick={() => openUserStories(i)}>
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
          <div className="modal-content story-frame" onClick={(e) => e.stopPropagation()}>
            {/* Top overlay bar with progress segments */}
            {showPlayer && (
              <div className="story-top">
                <div className="story-progress">
                  {showPlayer.group.items.map((_, i) => (
                    <span key={i} className="seg">
                      <span className="fill" style={{width: i < showPlayer.index ? '100%' : i === showPlayer.index ? `${Math.round(progress*100)}%` : '0%'}} />
                    </span>
                  ))}
                </div>
                <div className="row between" style={{alignItems:'center'}}>
                  <div className="row gap" style={{alignItems:'center'}}>
                    <img src={showPlayer.group.profile_pic || 'https://via.placeholder.com/40'} className="avatar" alt="Profile" />
                    <div className="bold small name">{showPlayer.group.name}</div>
                    {currentStory?.created_at && (
                      <div className="muted tiny">{timeAgo(currentStory.created_at)}</div>
                    )}
                  </div>
                  <div className="row gap">
                    {/* Mute toggle */}
                    <button className="icon-btn" title={isMuted? 'Unmute' : 'Mute'} aria-label="Toggle audio" onClick={() => setIsMuted(m => !m)}>
                      {isMuted ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15 9a3 3 0 0 1 0 6"/><path d="M19 7a7 7 0 0 1 0 10"/></svg>
                      )}
                    </button>
                    {/* Menu placeholder */}
                    <button className="icon-btn" title="More" aria-label="More options">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>
                    </button>
                    <button className="icon-btn" title="Close" aria-label="Close" onClick={() => setShowPlayer(null)}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="story-media">
              {currentStory.media_type === 'video' ? (
                <video
                  src={currentStory.media_url}
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  style={{maxWidth:'90vw', maxHeight:'80vh'}}
                />
              ) : (
                <div>
                  <img src={currentStory.media_url} alt="story" style={{maxWidth:'90vw', maxHeight:'80vh'}} />
                  {currentStory.audio_url && <audio src={currentStory.audio_url} autoPlay controls={false} style={{display:'none'}} />}
                </div>
              )}
              {/* Removed top like overlay per request */}
              {user && currentStory.user_id === user.id && (
                <div className="media-overlay right">
                  <span className="pill small" title="Views">{Number(currentStory.views_count || 0)}</span>
                </div>
              )}

              {/* Media navigation arrows */}
              <button className="media-nav left" aria-label="Previous" onClick={prevStory} disabled={showPlayer.index===0}>
                <span className="nav-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </span>
              </button>
              <button className="media-nav right" aria-label="Next" onClick={nextStory} disabled={showPlayer.index===showPlayer.group.items.length-1}>
                <span className="nav-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </span>
              </button>

              {/* Large invisible tap zones (left/back, right/next) */}
              {/* Removed large tap zones to avoid accidental navigation */}
            </div>
            {/* Owner-only viewers button below media */}
            {user && currentStory.user_id === user.id && (
              <div className="row end" style={{marginTop:6}}>
                <button className="btn btn-light" onClick={openViewers} aria-label="See viewers">Viewers</button>
              </div>
            )}

            {/* Bottom reply overlay */}
            <div className="story-bottom">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${showPlayer?.group?.name || 'story'}...`}
                aria-label="Reply to story"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                className="reply-input"
              />
              <button className="icon-btn" title="Share" aria-label="Share story" onClick={sendReply} disabled={sending}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
              <button
                className={`icon-btn ${currentStory.liked_by_me ? 'active' : ''}`}
                title="Like"
                aria-label="Like"
                aria-pressed={currentStory.liked_by_me}
                onClick={toggleLike}
                disabled={likeBusy}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {currentStory.liked_by_me ? (
                    <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z" fill="currentColor" />
                  ) : (
                    <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z" />
                  )}
                </svg>
              </button>
            </div>

            {toast && (
              <div className="toast small">{toast}</div>
            )}

            {/* Viewers list for owner - separate modal for better visibility */}
            {viewersOpen && user && (
              <div className="modal" onClick={() => setViewersOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="row between" style={{marginBottom:6, alignItems:'center'}}>
                    <div className="bold">Viewers ({viewers.length})</div>
                    <button className="icon-btn" aria-label="Close viewers" onClick={() => setViewersOpen(false)}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                  <div className="list" style={{maxHeight: '60vh', overflow:'auto'}}>
                    {viewers.map(v => (
                      <div key={v.id} className="list-item">
                        <img src={v.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
                        <div className="bold small" style={{display:'flex', alignItems:'center', gap:8}}>
                          {v.name}
                          {v.liked && (
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              fill="red"
                              aria-label="Liked"
                              role="img"
                              style={{marginLeft:6}}
                            >
                              <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                    {viewers.length === 0 && <div className="muted small">No viewers yet.</div>}
                  </div>
                </div>
              </div>
            )}
            <div className="row center" style={{marginTop:8}}>
              <div className="muted small">{showPlayer.index+1} / {showPlayer.group.items.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
