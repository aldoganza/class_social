import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import PostCard from '../components/PostCard.jsx'

export default function Home() {
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [feed, setFeed] = useState([])
  const [error, setError] = useState('')
  const [tab, setTab] = useState('explore') // 'following' | 'explore'

  const loadFeed = async (target = tab) => {
    try {
      const endpoint = target === 'following' ? '/posts/feed' : '/posts/explore'
      const data = await api.get(endpoint)
      setFeed(data)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    loadFeed('explore')
  }, [])

  useEffect(() => {
    loadFeed(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

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
      await loadFeed(tab)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="page">
      <div className="card row between">
        <div className="row gap">
          <button className={`btn ${tab === 'following' ? 'btn-primary' : 'btn-light'}`} onClick={() => setTab('following')}>Following</button>
          <button className={`btn ${tab === 'explore' ? 'btn-primary' : 'btn-light'}`} onClick={() => setTab('explore')}>Explore</button>
        </div>
        <span className="muted small">View {tab === 'following' ? 'posts from people you follow' : 'recent posts from everyone'}</span>
      </div>

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
