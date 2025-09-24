import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import PostCard from '../components/PostCard.jsx'
import StoriesBar from '../components/StoriesBar.jsx'

export default function Home() {
  const [feed, setFeed] = useState([])
  const [tab, setTab] = useState('explore') // 'following' | 'explore'

  const loadFeed = async (target = tab) => {
    try {
      const endpoint = target === 'following' ? '/posts/feed' : '/posts/explore'
      const data = await api.get(endpoint)
      setFeed(data)
    } catch (e) {
      // ignore feed loading errors here; consider adding a toast if needed
      console.error(e)
    }
  }

  useEffect(() => {
    loadFeed('explore')
  }, [])

  useEffect(() => {
    loadFeed(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // Posting is handled on Profile page only.

  return (
    <div className="page home">
      <StoriesBar />
      <div className="card row between">
        <div className="row gap">
          <button className={`btn ${tab === 'following' ? 'btn-primary' : 'btn-light'}`} onClick={() => setTab('following')}>Following</button>
          <button className={`btn ${tab === 'explore' ? 'btn-primary' : 'btn-light'}`} onClick={() => setTab('explore')}>Explore</button>
        </div>
        <span className="muted small">View {tab === 'following' ? 'posts from people you follow' : 'recent posts from everyone'}</span>
      </div>

      <div className="feed">
        {feed.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  )
}
