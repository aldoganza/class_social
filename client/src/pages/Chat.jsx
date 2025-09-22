import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Chat() {
  const { id } = useParams() // chatting with user id
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const loadConversations = async () => {
    try {
      const data = await api.get('/messages/conversations')
      setConversations(data)
    } catch (e) {
      // silently ignore
    }
  }

  useEffect(() => {
    loadConversations()
    const fetchMessages = async () => {
      if (!id) return
      try {
        const data = await api.get(`/messages/${id}`)
        setMessages(data)
        // Mark messages from this user as read
        await api.post(`/messages/${id}/read`, {})
        // Notify Navbar to refresh unread badge now
        window.dispatchEvent(new Event('refresh-unread'))
      } catch (e) {
        setError(e.message)
      }
    }
    fetchMessages()
  }, [id])

  const searchUsers = async (q) => {
    setQuery(q)
    if (!q) return setResults([])
    try {
      const data = await api.get(`/users?q=${encodeURIComponent(q)}`)
      setResults(data)
    } catch (e) {
      setError(e.message)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!id || !text.trim()) return
    try {
      const msg = await api.post(`/messages/${id}`, { content: text })
      setMessages((m) => [...m, msg])
      setText('')
      loadConversations()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="page two-col">
      <div className="card sidebar">
        <h3 style={{marginTop:0}}>Messages</h3>
        <div className="list">
          {conversations.map(c => (
            <a key={c.id} className="list-item" href={`/chat/${c.id}`}>
              <img src={c.profile_pic || 'https://via.placeholder.com/40'} className="avatar" />
              <div style={{flex:1}}>
                <div className="row between">
                  <span className="bold">{c.name}</span>
                  {c.unread_count > 0 && <span className="badge">{c.unread_count > 99 ? '99+' : c.unread_count}</span>}
                </div>
                <div className="muted small" title={c.last_message || ''}>{(c.last_message || '').slice(0, 40)}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="card chat">
        {!id && <div className="muted">Select a classmate to start chatting.</div>}
        {id && (
          <>
            <div className="messages">
              {messages.map(m => (
                <div key={m.id} className={`bubble ${m.sender_id === user?.id ? 'me' : 'them'}`}>
                  {m.content}
                  <div className="timestamp">{new Date(m.created_at).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="row gap">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
              <button className="btn btn-primary">Send</button>
            </form>
          </>
        )}
      </div>

      {error && <div className="error floating">{error}</div>}
    </div>
  )
}
