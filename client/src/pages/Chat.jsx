import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Chat() {
  const { id } = useParams() // chatting with user id
  const navigate = useNavigate()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [otherUser, setOtherUser] = useState(null)
  const messagesRef = useRef(null)
  const composerRef = useRef(null)

  const loadConversations = async () => {
    try {
      const data = await api.get('/messages/conversations')
      setConversations(data)
    } catch (e) {
      // silently ignore
    }
  }

  const deleteMessage = async (messageId) => {
    try {
      await api.del(`/messages/${messageId}`)
      setMessages((prev) => prev.filter(m => m.id !== messageId))
      // Refresh conversations preview
      loadConversations()
    } catch (e) {
      setError(e.message)
    }
  }

  const hideMessage = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/hide`, {})
      setMessages((prev) => prev.filter(m => m.id !== messageId))
      loadConversations()
    } catch (e) { setError(e.message) }
  }

  const chooseDelete = async (messageId) => {
    try {
      const forEveryone = window.confirm('Delete for everyone?\nPress OK to delete for everyone, or Cancel to delete for you only.')
      if (forEveryone) await deleteMessage(messageId); else await hideMessage(messageId)
    } catch (e) { setError(e.message) }
  }

  useEffect(() => {
    loadConversations()
    const fetchMessages = async () => {
      if (!id) return
      try {
        // fetch other user info for header
        try {
          const u = await api.get(`/users/${id}`)
          setOtherUser(u)
        } catch {}
        const data = await api.get(`/messages/${id}`)
        setMessages(data)
        // scroll to bottom
        setTimeout(() => {
          if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight
          }
        }, 0)
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
      // scroll to bottom after send
      setTimeout(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight
        }
      }, 0)
    } catch (e) {
      setError(e.message)
    }
  }

  const onComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (text.trim()) {
        // simulate submit
        sendMessage(e)
      }
    }
  }

  const onComposerChange = (e) => {
    setText(e.target.value)
    // auto-grow
    const el = composerRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }

  // Convert URLs in plain text to clickable links that navigate within the app
  const renderWithLinks = (text) => {
    if (!text) return null
    const splitter = /(https?:\/\/\S+)/g // global only for splitting
    const parts = String(text).split(splitter)
    return parts.map((part, i) => {
      // Use a non-global test to avoid lastIndex issues
      const isUrl = /^(https?:\/\/\S+)$/.test(part)
      if (isUrl) {
        const url = part
        const onClick = (e) => {
          try {
            const u = new URL(url)
            if (u.origin === window.location.origin) {
              e.preventDefault()
              navigate(u.pathname + u.search)
              return
            }
          } catch {}
        }
        return (
          <a key={i} href={url} onClick={onClick} className="link" rel="noopener noreferrer">
            {url}
          </a>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="page two-col chat-layout">
      <div className="card sidebar">
        <h3 style={{marginTop:0}}>Messages</h3>
        <div className="list" role="navigation" aria-label="Conversations list">
          {conversations.map(c => (
            <a key={c.id} className={`list-item ${String(c.id)===String(id)?'active':''}`} href={`/chat/${c.id}`}>
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
            <div className="chat-header row gap" style={{alignItems:'center'}}>
              <img src={otherUser?.profile_pic || 'https://via.placeholder.com/40'} className="avatar" alt="Chat user" />
              <div>
                <div className="bold">{otherUser?.name || 'Conversation'}</div>
                <div className="muted small">{otherUser?.email || ''}</div>
              </div>
            </div>

            <div className="messages" aria-live="polite" ref={messagesRef}>
              {messages.map((m, idx) => {
                const dateStr = new Date(m.created_at).toDateString()
                const prev = messages[idx - 1]
                const prevDateStr = prev ? new Date(prev.created_at).toDateString() : null
                const showSeparator = !prev || dateStr !== prevDateStr
                const mine = m.sender_id === user?.id
                const rowStyle = { display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start', gap:8, margin:'6px 0' }
                const bubbleStyle = mine
                  ? { background:'#1877f2', color:'#fff', borderRadius:16, borderTopRightRadius:4, padding:'8px 12px', maxWidth: '70%', alignSelf:'flex-end' }
                  : { background:'rgba(255,255,255,0.08)', color:'#fff', borderRadius:16, borderTopLeftRadius:4, padding:'8px 12px', maxWidth: '70%', alignSelf:'flex-start' }
                return (
                  <div key={m.id}>
                    {showSeparator && (
                      <div className="separator" role="separator" aria-label={dateStr} style={{textAlign:'center', margin:'10px 0'}}>{dateStr}</div>
                    )}
                    <div style={rowStyle}>
                      {!mine && (
                        <img src={otherUser?.profile_pic || 'https://via.placeholder.com/32'} className="avatar" alt="Sender avatar" />
                      )}
                      <div style={{display:'flex', flexDirection:'column', alignItems: mine ? 'flex-end' : 'flex-start'}}>
                        <div style={bubbleStyle}>
                          <div className="row" style={{alignItems:'center', gap:8}}>
                            <div>{renderWithLinks(m.content)}</div>
                            {mine && (
                              <button
                                className="icon-btn"
                                title="Delete"
                                aria-label="Delete message"
                                onClick={() => chooseDelete(m.id)}
                                style={{opacity:0.8}}
                              >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="timestamp" style={{marginTop:4, color:'var(--muted)', fontSize:12}}>{new Date(m.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <form onSubmit={sendMessage} className="composer row gap" aria-label="Send message form">
              <button type="button" className="icon-btn" title="Emoji" aria-label="Open emoji">😊</button>
              <textarea
                ref={composerRef}
                rows={1}
                value={text}
                onChange={onComposerChange}
                onKeyDown={onComposerKeyDown}
                placeholder="Message..."
                aria-label="Message text"
              />
              <button type="button" className="icon-btn" title="Voice" aria-label="Record voice">🎤</button>
              <button type="button" className="icon-btn" title="Image" aria-label="Attach image">🖼️</button>
              <button type="button" className="icon-btn" title="Like" aria-label="Send like">❤</button>
              <button className="btn btn-primary" aria-label="Send message">➤</button>
            </form>
          </>
        )}
      </div>

      {error && <div className="error floating">{error}</div>}
    </div>
  )
}
