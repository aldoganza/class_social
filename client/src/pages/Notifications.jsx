import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function Notifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState(new Set())
  const [processingFollow, setProcessingFollow] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.get('/notifications')
        setItems(data)
        
        // Load following list to check who user is already following
        try {
          const following = await api.get('/follows/following')
          setFollowingIds(new Set(following.map(u => u.id)))
        } catch {}
        
        // mark as read after loading
        try {
          await api.post('/notifications/read', {})
          window.dispatchEvent(new Event('refresh-notifications'))
        } catch {}
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toText = (n) => {
    const who = n.actor_name || 'Someone'
    if (n.type === 'follow') return `${who} started following you`
    if (n.type === 'like') return `${who} liked your post`
    if (n.type === 'comment') return `${who} commented on your post`
    if (n.type === 'group_added') return n.message || `${who} added you to a group`
    if (n.type === 'group_admin') return n.message || `${who} promoted you to admin`
    return `${who} did something`
  }

  const handleFollowBack = async (actorId) => {
    setProcessingFollow(actorId)
    try {
      await api.post(`/follows/${actorId}`)
      setFollowingIds(prev => new Set([...prev, actorId]))
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessingFollow(null)
    }
  }

  const handleUnfollow = async (actorId) => {
    setProcessingFollow(actorId)
    try {
      await api.del(`/follows/${actorId}`)
      setFollowingIds(prev => {
        const next = new Set(prev)
        next.delete(actorId)
        return next
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessingFollow(null)
    }
  }

  const goToProfile = (actorId) => {
    navigate(`/profile/${actorId}`)
  }

  return (
    <div className="page">
      <div className="card">
        <h2 className="title">Notifications</h2>
        {error && <div className="error">{error}</div>}
        {loading && <div className="muted">Loading...</div>}
        {!loading && items.length === 0 && <div className="muted">No notifications.</div>}
        <div className="list" style={{marginTop: 8}}>
          {items.map(n => (
            <div key={n.id} className="list-item" style={{alignItems:'center'}}>
              <img 
                src={n.actor_pic || 'https://via.placeholder.com/32'} 
                className="avatar" 
                style={{cursor: 'pointer'}}
                onClick={() => goToProfile(n.actor_id)}
              />
              <div style={{flex:1}}>
                <div className="bold small">{toText(n)}</div>
                <div className="muted small">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              
              {/* Show post thumbnail for post-related notifications */}
              {n.post_image && (
                <img 
                  src={n.post_image} 
                  alt="post" 
                  style={{width:48,height:48,objectFit:'cover',borderRadius:8,marginRight:8,cursor:'pointer'}}
                  onClick={() => navigate(`/post/${n.post_id}`)}
                />
              )}
              
              {/* Show group thumbnail for group-related notifications */}
              {(n.type === 'group_added' || n.type === 'group_admin') && n.group_pic && (
                <img 
                  src={n.group_pic} 
                  alt="group" 
                  style={{width:48,height:48,objectFit:'cover',borderRadius:8,marginRight:8,cursor:'pointer'}}
                  onClick={() => navigate(`/groups/${n.group_id}`)}
                />
              )}
              
              {/* Show View Group button for group notifications */}
              {(n.type === 'group_added' || n.type === 'group_admin') && (
                <button 
                  className="btn btn-primary"
                  style={{fontSize:12, padding:'6px 12px'}}
                  onClick={() => navigate(`/groups/${n.group_id}`)}
                >
                  View Group
                </button>
              )}
              
              {/* Show Follow Back button for follow notifications */}
              {n.type === 'follow' && (
                <div style={{display:'flex', gap:8}}>
                  {followingIds.has(n.actor_id) ? (
                    <button 
                      className="btn btn-light"
                      style={{fontSize:12, padding:'6px 12px'}}
                      onClick={() => handleUnfollow(n.actor_id)}
                      disabled={processingFollow === n.actor_id}
                    >
                      {processingFollow === n.actor_id ? '...' : 'Following'}
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      style={{fontSize:12, padding:'6px 12px'}}
                      onClick={() => handleFollowBack(n.actor_id)}
                      disabled={processingFollow === n.actor_id}
                    >
                      {processingFollow === n.actor_id ? '...' : 'Follow Back'}
                    </button>
                  )}
                  <button 
                    className="btn btn-light"
                    style={{fontSize:12, padding:'6px 12px'}}
                    onClick={() => goToProfile(n.actor_id)}
                  >
                    View Profile
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
