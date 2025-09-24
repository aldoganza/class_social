import { useState } from 'react'
import { api } from '../lib/api'

export default function Create() {
  const [media, setMedia] = useState(null)
  const [audio, setAudio] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [uploading, setUploading] = useState(false)

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

  const postStory = async () => {
    if (!media) return
    setUploading(true)
    setError('')
    setOk('')
    try {
      const fd = new FormData()
      fd.append('media', media)
      if (audio) fd.append('audio', audio)
      await api.postForm('/stories', fd)
      setOk('Story posted! It will expire in 24 hours.')
      setMedia(null); setAudio(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h2 className="title">Create</h2>
        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}
        <div className="row gap" style={{alignItems:'center'}}>
          <label className="btn btn-light" htmlFor="create-media">Choose image or video</label>
          <input id="create-media" type="file" accept="image/*,video/*" onChange={onFile} style={{display:'none'}} />
          <label className="btn btn-light" htmlFor="create-audio">Add audio (optional)</label>
          <input id="create-audio" type="file" accept="audio/*" onChange={onAudio} style={{display:'none'}} />
          <button className="btn btn-primary" disabled={!media || uploading} onClick={postStory}>{uploading ? 'Uploading...' : 'Post Story'}</button>
        </div>
        {media && (
          <div className="preview" style={{marginTop:12}}>
            <span className="small muted">Selected: {media.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
