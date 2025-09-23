import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function PostCard({ post }) {
  const [likes, setLikes] = useState(Number(post.likes_count || 0))
  const [commentsCount, setCommentsCount] = useState(Number(post.comments_count || 0))
  const [liked, setLiked] = useState(Boolean(post.liked_by_me))
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [shared, setShared] = useState(false)

  const loadComments = async () => {
    try {
      const data = await api.get(`/posts/${post.id}/comments`)
      setComments(data)
    } catch (e) { /* ignore */ }
  }

  const sharePost = async () => {
    const shareUrl = `${window.location.origin}/profile/${post.user_id}?post=${post.id}`
    const shareData = {
      title: `${post.name}'s post`,
      text: post.content ? String(post.content).slice(0, 120) : 'Check out this post',
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
        setShared(true)
        setTimeout(() => setShared(false), 1600)
      } else {
        // Fallback: create temp input
        const el = document.createElement('textarea')
        el.value = shareUrl
        document.body.appendChild(el)
        el.select()
        try { document.execCommand('copy') } catch {}
        document.body.removeChild(el)
        setShared(true)
        setTimeout(() => setShared(false), 1600)
      }
    } catch (e) {
      // no-op on share cancel
    }
  }

  useEffect(() => {
    if (showComments && comments.length === 0) loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments])

  const toggleLike = async () => {
    try {
      if (liked) {
        const res = await api.del(`/posts/${post.id}/like`)
        setLiked(false)
        setLikes(Number(res.likes_count || 0))
      } else {
        const res = await api.post(`/posts/${post.id}/like`, {})
        setLiked(true)
        setLikes(Number(res.likes_count || 0))
      }
    } catch (e) {
      // silently ignore errors
    }
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      const c = await api.post(`/posts/${post.id}/comments`, { content: commentText })
      setComments((cs) => [...cs, c])
      setCommentText('')
      setCommentsCount((n) => n + 1)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="card post-card">
      <div className="row gap">
        <img src={post.profile_pic || 'https://via.placeholder.com/40'} className="avatar" />
        <div>
          <div className="bold"><Link to={`/profile/${post.user_id}`}>{post.name}</Link></div>
          <div className="muted small">{new Date(post.created_at).toLocaleString()}</div>
        </div>
      </div>
      {post.content && <p className="content">{post.content}</p>}
      {post.image_url && (
        <div className="image-wrapper">
          <img src={post.image_url} alt="post image" />
        </div>
      )}

      <div className="row between" style={{marginTop:8}}>
        <div className="row gap">
          <button className={`btn ${liked ? 'btn-primary' : 'btn-light'}`} onClick={toggleLike}>
            {liked ? '♥ Liked' : '♡ Like'}
          </button>
          <button className="btn btn-light" onClick={() => setShowComments((s) => !s)}>
            💬 Comments ({commentsCount})
          </button>
          <button className="btn btn-light" onClick={sharePost}>
            🔗 Share
          </button>
        </div>
        <div className="row gap" style={{alignItems:'center'}}>
          {shared && <span className="muted small">Link copied</span>}
          <span className="muted small">{likes} likes</span>
        </div>
      </div>

      {showComments && (
        <div className="comments" style={{marginTop:8}}>
          <div className="list" style={{maxHeight: '240px', overflow: 'auto'}}>
            {comments.map(c => (
              <div key={c.id} className="list-item">
                <img src={c.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
                <div>
                  <div className="bold">{c.name}</div>
                  <div className="small">{c.content}</div>
                </div>
              </div>
            ))}
            {comments.length === 0 && <div className="muted small">No comments yet.</div>}
          </div>
          <form onSubmit={addComment} className="row gap" style={{marginTop:8}}>
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." />
            <button className="btn btn-primary">Post</button>
          </form>
        </div>
      )}
    </div>
  )
}
