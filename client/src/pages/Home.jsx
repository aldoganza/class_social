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
      {/* Stories Section */}
      <div className="stories-section">
        <StoriesBar />
      </div>

      {/* Feed Header */}
      <div className="feed-header card">
        <div className="feed-tabs">
          <button 
            className={`feed-tab ${tab === 'following' ? 'active' : ''}`} 
            onClick={() => setTab('following')}
          >
            <span className="tab-icon">👥</span>
            <span className="tab-label">Following</span>
          </button>
          <button 
            className={`feed-tab ${tab === 'explore' ? 'active' : ''}`} 
            onClick={() => setTab('explore')}
          >
            <span className="tab-icon">🌍</span>
            <span className="tab-label">Explore</span>
          </button>
        </div>
        <p className="feed-description">
          {tab === 'following' 
            ? '📱 Posts from people you follow' 
            : '🔥 Discover posts from everyone'}
        </p>
      </div>

      {/* Feed Content */}
      <div className="feed">
        {feed.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📭</div>
            <h3>No posts yet</h3>
            <p className="muted">
              {tab === 'following' 
                ? 'Follow some classmates to see their posts here' 
                : 'Be the first to share something!'}
            </p>
          </div>
        ) : (
          feed.map((p) => (
            <PostCard key={p.id} post={p} />
          ))
        )}
      </div>
    </div>
  )
}
