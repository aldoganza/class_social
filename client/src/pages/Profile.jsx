import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import PostCard from '../components/PostCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Profile() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [loadingFollow, setLoadingFollow] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const u = await api.get(`/users/${id}`)
        setUser(u)
        const ps = await api.get(`/posts/user/${id}`)
        setPosts(ps)
        // Determine follow status (if viewing someone else's profile)
        if (me && String(me.id) !== String(id)) {
          const following = await api.get('/follow/following')
          const followed = following.some(f => String(f.id) === String(id))
          setIsFollowing(followed)
        } else {
          setIsFollowing(false)
        }
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [id, me])

  const toggleFollow = async () => {
    if (!me || String(me.id) === String(id)) return
    setLoadingFollow(true)
    try {
      if (isFollowing) {
        await api.del(`/follow/${id}`)
        setIsFollowing(false)
      } else {
        await api.post(`/follow/${id}`, {})
        setIsFollowing(true)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingFollow(false)
    }
  }

  if (!user) return <div className="page"><div className="card">Loading...</div></div>

  return (
    <div className="page">
      {error && <div className="error">{error}</div>}
      <div className="card row gap">
        <img src={user.profile_pic || 'https://via.placeholder.com/80'} alt="pfp" className="avatar-lg" />
        <div>
          <h2>{user.name}</h2>
          <div className="muted">Joined {new Date(user.created_at).toLocaleDateString()}</div>
        </div>
        {me && String(me.id) !== String(id) && (
          <div style={{ marginLeft: 'auto' }}>
            <button className={`btn ${isFollowing ? 'btn-light' : 'btn-primary'}`} onClick={toggleFollow} disabled={loadingFollow}>
              {loadingFollow ? 'Please wait...' : isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        )}
      </div>

      <div className="feed">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  )
}
