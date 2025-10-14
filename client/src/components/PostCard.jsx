import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { api } from '../lib/api'

export default function PostCard({ post }) {
  const [likes, setLikes] = useState(Number(post.likes_count || 0))
  const [commentsCount, setCommentsCount] = useState(Number(post.comments_count || 0))
  const [liked, setLiked] = useState(Boolean(post.liked_by_me))
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [shared, setShared] = useState(false)
  const [expandCaption, setExpandCaption] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [following, setFollowing] = useState([])
  const [shareSending, setShareSending] = useState({}) // userId => true when sending
  const videoRef = useRef(null)

  const loadComments = async () => {
    try {
      const data = await api.get(`/posts/${post.id}/comments`)
      setComments(data)
    } catch (e) { /* ignore */ }
  }

  const shareUrl = `${window.location.origin}/profile/${post.user_id}?post=${post.id}`

  const shareSystem = async () => {
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

  const toggleShareMenu = async () => {
    setShareOpen((s) => !s)
    try {
      if (following.length === 0) {
        const list = await api.get('/follows/following')
        setFollowing(list)
      }
    } catch {}
  }

  const sendShareTo = async (userId) => {
    try {
      setShareSending((m) => ({ ...m, [userId]: true }))
      await api.post(`/messages/${userId}`, { content: shareUrl })
      // optional visual feedback: briefly show "Sent"
      setShareSending((m) => ({ ...m, [userId]: false, [`sent_${userId}`]: true }))
      setTimeout(() => setShareSending((m) => ({ ...m, [`sent_${userId}`]: false })), 1500)
      // also refresh unread badge for the receiver won't happen here, but for our own sidebar we can leave as is
    } catch (e) {
      // ignore errors silently or surface a toast later
      setShareSending((m) => ({ ...m, [userId]: false }))
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

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  return (
    <div className="card post-card">
      {/* Header */}
      <div className="row gap" style={{marginBottom:8}}>
        <img src={post.profile_pic || 'https://via.placeholder.com/40'} className="avatar" />
        <div>
          <div className="bold"><Link to={`/profile/${post.user_id}`}>{post.name}</Link></div>
          <div className="muted small">{new Date(post.created_at).toLocaleString()}</div>
        </div>
      </div>

      {/* Media */}
      {post.image_url && (
        <div className="image-wrapper">
          <img src={post.image_url} alt="post image" />
        </div>
      )}
      {post.video_url && (
        <div className="image-wrapper" style={{cursor:'pointer'}} onClick={toggleVideoPlay}>
          <video 
            ref={videoRef}
            src={post.video_url} 
            loop
          />
        </div>
      )}

      {/* Actions like Instagram */}
      <div className="row between actions" style={{marginTop:10}}>
        <div className="row gap">
          <button className={`icon-btn ${liked ? 'active' : ''}`} onClick={toggleLike} aria-label="Like">
            <HeartIcon filled={liked} />
          </button>
          <button className="icon-btn" onClick={() => setShowComments((s) => !s)} aria-label="Comments">
            <CommentIcon />
          </button>
          <button className="icon-btn" onClick={toggleShareMenu} aria-label="Share">
            <ShareIcon />
          </button>
        </div>
      </div>

      {shareOpen && (
        <div className="share-menu card" style={{marginTop:8}}>
          <div className="row between" style={{marginBottom:6}}>
            <div className="bold">Share</div>
            <div className="row gap">
              <button className="btn btn-light" onClick={shareSystem}>System share</button>
              <button className="btn btn-light" onClick={() => setShareOpen(false)}>Close</button>
            </div>
          </div>
          <div className="muted small" style={{marginBottom:6}}>Send to students you follow</div>
          <div className="list" style={{maxHeight: 220, overflow: 'auto'}}>
            {following.map(u => (
              <div key={u.id} className="list-item" style={{justifyContent:'space-between', alignItems:'center'}}>
                <div className="row gap">
                  <img src={u.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
                  <div className="bold small">{u.name}</div>
                </div>
                <div className="row gap">
                  {shareSending[`sent_${u.id}`] && <span className="muted small">Sent</span>}
                  <button className="btn btn-primary" disabled={!!shareSending[u.id]} onClick={() => sendShareTo(u.id)}>
                    {shareSending[u.id] ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            ))}
            {following.length === 0 && (
              <div className="muted small">You are not following anyone yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Likes */}
      <div className="bold small" style={{marginTop:8}}>{likes} likes</div>

      {/* Caption at bottom with See more */}
      {post.content && (
        <div className="caption" style={{marginTop:6}}>
          <Link to={`/profile/${post.user_id}`} className="bold" style={{marginRight:6}}>{post.name}</Link>
          <span>
            {!expandCaption && post.content.length > 160 ? (
              <>
                {post.content.slice(0, 160)}<span className="muted">...</span>
                <button type="button" className="see-more" onClick={() => setExpandCaption(true)}>See more</button>
              </>
            ) : (
              <>
                {post.content}
                {post.content.length > 160 && (
                  <button type="button" className="see-more" onClick={() => setExpandCaption(false)}>See less</button>
                )}
              </>
            )}
          </span>
        </div>
      )}

      {/* Comments */}
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
      {shared && <div className="muted small" style={{marginTop:6}}>Link copied</div>}
    </div>
  )
}

function IconBase({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

function HeartIcon({ filled }) {
  return (
    <IconBase>
      {filled ? (
        <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z" fill="currentColor" />
      ) : (
        <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0s-1.9 5 0 6.9L12 22l8.8-8.8c1.9-1.9 1.9-5 0-6.9z" />
      )}
    </IconBase>
  )
}

function CommentIcon() {
  return (
    <IconBase>
      <path d="M21 11c0 4.418-4.03 8-9 8-1.36 0-2.64-.25-3.8-.7L4 21l1.2-3.1A8.72 8.72 0 0 1 3 11C3 6.582 7.03 3 12 3s9 3.582 9 8z" />
    </IconBase>
  )
}

function ShareIcon() {
  return (
    <IconBase>
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9Z" fill="none" />
    </IconBase>
  )
}
