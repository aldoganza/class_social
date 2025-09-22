import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Search() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return }
      setLoading(true)
      setError('')
      try {
        const data = await api.get(`/users?q=${encodeURIComponent(q)}`)
        setResults(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="page">
      <div className="card">
        <h2 style={{marginTop:0}}>Search Classmates</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name or email..." />
        {loading && <div className="muted small">Searching...</div>}
        {error && <div className="error">{error}</div>}
      </div>

      <div className="card">
        <div className="list">
          {results.map(u => (
            <div key={u.id} className="list-item" style={{justifyContent:'space-between'}}>
              <div className="row gap">
                <img src={u.profile_pic || 'https://via.placeholder.com/40'} className="avatar" />
                <div>
                  <div className="bold">{u.name}</div>
                  <div className="muted small">{u.email}</div>
                </div>
              </div>
              <div className="row gap">
                <a className="btn btn-light" href={`/profile/${u.id}`}>View</a>
                <a className="btn btn-primary" href={`/chat/${u.id}`}>Message</a>
              </div>
            </div>
          ))}
          {results.length === 0 && !loading && !error && (
            <div className="muted">No results yet. Try searching for a classmate.</div>
          )}
        </div>
      </div>
    </div>
  )
}
