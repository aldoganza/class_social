import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import PostCard from '../components/PostCard.jsx'

export default function Home() {
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [feed, setFeed] = useState([])
  const [error, setError] = useState('')

  const loadFeed = async () => {
    try {
      const data = await api.get('/posts/feed')
      setFeed(data)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  const onPost = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const form = new FormData()
      form.append('content', content)
      if (image) form.append('image', image)
      await api.post('/posts', form)
      setContent('')
      setImage(null)
      await loadFeed()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="page">
      <div className="card create-post">
        <h2>Create Post</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onPost} className="form row">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share something..." />
          <div className="row between">
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
            <button className="btn btn-accent">Post</button>
          </div>
        </form>
      </div>

      <div className="feed">
        {feed.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  )
}
