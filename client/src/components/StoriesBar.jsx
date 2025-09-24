import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function StoriesBar() {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [grouped, setGrouped] = useState([]) // [{ user_id, name, profile_pic, items: [stories...] }]
  const [media, setMedia] = useState(null)
  const [audio, setAudio] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showPlayer, setShowPlayer] = useState(null) // story to show

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

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setMedia(f)
  }

  const onAudio = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setAudio(f)
  }

  const upload = async () => {
    if (!media) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('media', media)
      if (audio) fd.append('audio', audio)
      await api.postForm('/stories', fd)
      setMedia(null)
      setAudio(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

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

  return (
    <div className="stories-bar card">
      {error && <div className="error">{error}</div>}
      <div className="row gap" style={{alignItems:'center', justifyContent:'space-between'}}>
        <div className="row gap" style={{alignItems:'center'}}>
          <label className="btn btn-light" htmlFor="story-media">Add Story</label>
          <input id="story-media" type="file" accept="image/*,video/*" onChange={onFile} style={{display:'none'}} />
          <label className="btn btn-light" htmlFor="story-audio">Audio (optional)</label>
          <input id="story-audio" type="file" accept="audio/*" onChange={onAudio} style={{display:'none'}} />
          <button className="btn btn-primary" onClick={upload} disabled={!media || uploading}>{uploading ? 'Uploading...' : 'Post Story'}</button>
        </div>
      </div>

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
                <button className="btn btn-light" onClick={() => setShowPlayer(null)}>Close</button>
              </div>
            </div>
            {currentStory.media_type === 'video' ? (
              <video src={currentStory.media_url} controls autoPlay style={{maxWidth:'90vw', maxHeight:'80vh'}} />
            ) : (
              <div>
                <img src={currentStory.media_url} alt="story" style={{maxWidth:'90vw', maxHeight:'80vh'}} />
                {currentStory.audio_url && <audio src={currentStory.audio_url} controls autoPlay style={{width:'100%', marginTop:8}} />}
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
