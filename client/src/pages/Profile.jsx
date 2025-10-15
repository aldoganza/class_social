import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { getAvatarUrl } from '../lib/defaultAvatar'
import PostCard from '../components/PostCard'

export default function Profile() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [reels, setReels] = useState([])
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 })
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [tab, setTab] = useState('posts') // 'posts' | 'reels' | 'followers' | 'following'
  const [newContent, setNewContent] = useState('')
  const [newImage, setNewImage] = useState(null)
  const [newVideo, setNewVideo] = useState(null)

  useEffect(() => {
    // If opened via shared link with ?story=, redirect to Home to open the story viewer
    const sharedStory = searchParams.get('story')
    if (sharedStory) {
      navigate('/', { replace: true, state: { openStoryId: Number(sharedStory) } })
      return
    }

    // If opened via shared reel link, switch to reels tab
    const sharedReel = searchParams.get('reel')
    if (sharedReel) {
      setTab('reels')
    }

    // If opened via shared post link, switch to posts tab
    const sharedPost = searchParams.get('post')
    if (sharedPost) {
      setTab('posts')
    }

    async function load() {
      try {
        const u = await api.get(`/users/${id}`)
        setUser(u)
        const ps = await api.get(`/posts/user/${id}`)
        setPosts(ps)
        const rs = await api.get(`/reels/user/${id}`)
        setReels(rs)
        // Determine follow status (if viewing someone else's profile)
        if (me && String(me.id) !== String(id)) {
          const following = await api.get('/follows/following')
          const followed = following.some(f => String(f.id) === String(id))
          setIsFollowing(followed)
        } else {
          setIsFollowing(false)
        }
        // Load stats and lists
        const s = await api.get(`/users/${id}/stats`)
        setStats(s)
        const flwrs = await api.get(`/users/${id}/followers`)
        setFollowers(flwrs)
        const flwing = await api.get(`/users/${id}/following`)
        setFollowing(flwing)
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
        await api.del(`/follows/${id}`)
        setIsFollowing(false)
        setStats((s) => ({ ...s, followers: Math.max(0, (s.followers || 0) - 1) }))
      } else {
        await api.post(`/follows/${id}`, {})
        setIsFollowing(true)
        setStats((s) => ({ ...s, followers: (s.followers || 0) + 1 }))
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingFollow(false)
    }
  }

  const createPost = async (e) => {
    e.preventDefault()
    try {
      const form = new FormData()
      form.append('content', newContent)
      if (newImage) form.append('image', newImage)
      if (newVideo) form.append('video', newVideo)
      await api.post('/posts', form)
      setNewContent('')
      setNewImage(null)
      setNewVideo(null)
      const ps = await api.get(`/posts/user/${id}`)
      setPosts(ps)
      setStats((s) => ({ ...s, posts: (s.posts || 0) + 1 }))
    } catch (e) {
      setError(e.message)
    }
  }

  const deletePost = async (postId) => {
    if (!confirm('Delete this post?')) return
    try {
      await api.del(`/posts/${postId}`)
      setPosts((p) => p.filter((x) => x.id !== postId))
      setStats((s) => ({ ...s, posts: Math.max(0, (s.posts || 0) - 1) }))
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteReel = async (reelId) => {
    if (!confirm('Delete this reel?')) return
    try {
      await api.del(`/reels/${reelId}`)
      setReels((r) => r.filter((x) => x.id !== reelId))
    } catch (e) {
      setError(e.message)
    }
  }

  if (!user) return <div className="page"><div className="card">Loading...</div></div>

  return (
    <div className="page">
      {error && <div className="error">{error}</div>}
      <div className="card row gap" style={{alignItems:'center'}}>
        <img src={getAvatarUrl(user.profile_pic)} alt="pfp" className="avatar-lg" />
        <div style={{flex:1}}>
          <h2 style={{margin:'0 0 6px 0'}}>{user.name}</h2>
          <div className="row gap">
            <span className="bold">{stats.posts}</span><span className="muted small">posts</span>
            <span className="bold">{stats.followers}</span><span className="muted small">followers</span>
            <span className="bold">{stats.following}</span><span className="muted small">following</span>
          </div>
          <div className="muted small">Joined {new Date(user.created_at).toLocaleDateString()}</div>
        </div>
        {me && String(me.id) !== String(id) && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate(`/chat?user=${id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              💬 Message
            </button>
            <button className={`btn ${isFollowing ? 'btn-light' : 'btn-primary'}`} onClick={toggleFollow} disabled={loadingFollow}>
              {loadingFollow ? 'Please wait...' : isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        )}
      </div>

      <div className="card row gap">
        <button className={`btn ${tab==='posts'?'btn-primary':'btn-light'}`} onClick={() => setTab('posts')}>Posts</button>
        <button className={`btn ${tab==='reels'?'btn-primary':'btn-light'}`} onClick={() => setTab('reels')}>Reels</button>
        <button className={`btn ${tab==='followers'?'btn-primary':'btn-light'}`} onClick={() => setTab('followers')}>Followers</button>
        <button className={`btn ${tab==='following'?'btn-primary':'btn-light'}`} onClick={() => setTab('following')}>Following</button>
      </div>

      {tab === 'posts' && (
        <>
          {me && String(me.id) === String(id) && (
            <div className="card create-post">
              <h3>Create Post</h3>
              <form onSubmit={createPost} className="form">
                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Share something..." />
                <div className="row gap" style={{alignItems:'center'}}>
                  <label className="btn btn-light" style={{cursor:'pointer'}}>
                    📷 Image
                    <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files[0])} style={{display:'none'}} />
                  </label>
                  <label className="btn btn-light" style={{cursor:'pointer'}}>
                    🎥 Video
                    <input type="file" accept="video/*" onChange={(e) => setNewVideo(e.target.files[0])} style={{display:'none'}} />
                  </label>
                  {newImage && <span className="muted small">Image: {newImage.name}</span>}
                  {newVideo && <span className="muted small">Video: {newVideo.name}</span>}
                </div>
                <button className="btn btn-accent" style={{marginTop:8}}>Post</button>
              </form>
            </div>
          )}

          <div className="grid-posts">
            {posts.map((p) => (
              <div key={p.id} className="grid-post">
                {me && String(me.id) === String(id) && (
                  <div className="row between" style={{marginBottom:6}}>
                    <span className="muted small">{new Date(p.created_at).toLocaleDateString()}</span>
                    <button className="btn btn-light" onClick={() => deletePost(p.id)}>Delete</button>
                  </div>
                )}
                <PostCard post={p} />
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'reels' && (
        <>
          {reels.length === 0 && <div className="card"><div className="muted">No reels yet.</div></div>}
          <div className="grid-posts">
            {reels.map(r => (
              <div key={r.id} className="grid-post">
                {me && String(me.id) === String(id) && (
                  <div className="row between" style={{marginBottom:6}}>
                    <span className="muted small">{new Date(r.created_at).toLocaleDateString()}</span>
                    <button className="btn btn-light" onClick={() => deleteReel(r.id)}>Delete</button>
                  </div>
                )}
                <div className="card" style={{padding:0, overflow:'hidden'}}>
                  <video src={r.video_url} controls style={{width:'100%', height:'100%', minHeight:280, objectFit:'cover', background:'#000', display:'block'}} />
                  {r.caption && (
                    <div style={{padding:12}}>
                      <div className="row gap" style={{alignItems:'center', marginBottom:6}}>
                        <img src={getAvatarUrl(r.profile_pic)} className="avatar" />
                        <div className="small bold">{r.name}</div>
                      </div>
                      <div className="small">{r.caption}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'followers' && (
        <div className="card">
          <div className="list">
            {followers.map(f => (
              <a key={f.id} className="list-item" href={`/profile/${f.id}`}>
                <img src={getAvatarUrl(f.profile_pic)} className="avatar" />
                <div>
                  <div className="bold">{f.name}</div>
                  <div className="muted small">{f.email}</div>
                </div>
              </a>
            ))}
            {followers.length === 0 && <div className="muted">No followers yet.</div>}
          </div>
        </div>
      )}

      {tab === 'following' && (
        <div className="card">
          <div className="list">
            {following.map(f => (
              <a key={f.id} className="list-item" href={`/profile/${f.id}`}>
                <img src={getAvatarUrl(f.profile_pic)} className="avatar" />
                <div>
                  <div className="bold">{f.name}</div>
                  <div className="muted small">{f.email}</div>
                </div>
              </a>
            ))}
            {following.length === 0 && <div className="muted">Not following anyone yet.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
