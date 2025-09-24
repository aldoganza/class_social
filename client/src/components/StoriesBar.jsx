import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function StoriesBar() {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [media, setMedia] = useState(null)
  const [audio, setAudio] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showPlayer, setShowPlayer] = useState(null) // story to show

  const load = async () => {
    try {
      const data = await api.get('/stories')
      setStories(data)
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

      <div className="stories-strip" style={{display:'flex', gap:10, overflowX:'auto', marginTop:10, paddingBottom:6}}>
        {stories.map(s => (
          <button key={s.id} className="story" onClick={() => setShowPlayer(s)}>
            <img src={s.user_id === s.user_id ? (s.media_type==='image'? s.media_url : (s.profile_pic||'https://via.placeholder.com/64')) : s.media_url} alt="story" />
            <span className="small bold" title={s.name}>{s.name?.slice(0,14)}</span>
          </button>
        ))}
        {stories.length === 0 && <div className="muted small">No stories yet.</div>}
      </div>

      {showPlayer && (
        <div className="modal" onClick={() => setShowPlayer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row between" style={{marginBottom:8}}>
              <div className="bold">{showPlayer.name}</div>
              <div className="row gap">
                {user && showPlayer.user_id === user.id && (
                  <button className="btn btn-danger" onClick={() => deleteStory(showPlayer.id)}>Delete</button>
                )}
                <button className="btn btn-light" onClick={() => setShowPlayer(null)}>Close</button>
              </div>
            </div>
            {showPlayer.media_type === 'video' ? (
              <video src={showPlayer.media_url} controls autoPlay style={{maxWidth:'90vw', maxHeight:'80vh'}} />
            ) : (
              <div>
                <img src={showPlayer.media_url} alt="story" style={{maxWidth:'90vw', maxHeight:'80vh'}} />
                {showPlayer.audio_url && <audio src={showPlayer.audio_url} controls autoPlay style={{width:'100%', marginTop:8}} />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
