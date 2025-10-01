import { useState } from 'react'
import { api } from '../lib/api'

export default function Create() {
  const [media, setMedia] = useState(null)
  const [audio, setAudio] = useState(null)
  const [text, setText] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textBg, setTextBg] = useState('#00000080')
  const [textPos, setTextPos] = useState('bottom')
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
      if (text && text.trim()) {
        const v = text.trim()
        fd.append('caption', v) // preferred
        fd.append('text', v)     // legacy fallback
      }
      if (textColor) fd.append('text_color', textColor)
      if (textBg) fd.append('text_bg', textBg)
      if (textPos) fd.append('text_pos', textPos)
      await api.postForm('/stories', fd)
      setOk('Story posted! It will expire in 24 hours.')
      setMedia(null); setAudio(null); setText('')
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
            <div className="col" style={{gap:8, marginTop:10}}>
              <label className="small">Overlay text (optional)</label>
              <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Say something..." />
              <div className="row gap" style={{alignItems:'center'}}>
                <label className="small">Text color</label>
                <input type="color" value={textColor} onChange={(e)=>setTextColor(e.target.value)} />
                <label className="small">Background</label>
                <input type="color" value={textBg} onChange={(e)=>setTextBg(e.target.value)} />
                <label className="small">Position</label>
                <select value={textPos} onChange={(e)=>setTextPos(e.target.value)}>
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
