import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
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
    </div>
  )
}
