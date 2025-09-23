import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.get('/notifications')
        setItems(data)
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
    return `${who} did something`
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
            <div key={n.id} className="list-item" style={{alignItems:'flex-start'}}>
              <img src={n.actor_pic || 'https://via.placeholder.com/32'} className="avatar" />
              <div style={{flex:1}}>
                <div className="bold small">{toText(n)}</div>
                <div className="muted small">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {n.post_image && (
                <img src={n.post_image} alt="post" style={{width:48,height:48,objectFit:'cover',borderRadius:8}} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
