import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import PostCard from '../components/PostCard.jsx'

export default function Profile() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const u = await api.get(`/users/${id}`)
        setUser(u)
        const ps = await api.get(`/posts/user/${id}`)
        setPosts(ps)
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [id])

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
      </div>

      <div className="feed">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  )
}
