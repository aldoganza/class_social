import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function GroupChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [processingMember, setProcessingMember] = useState(null)
  const messagesRef = useRef(null)

  useEffect(() => {
    loadGroup()
    loadMembers()
    loadMessages()
  }, [id])

  const loadGroup = async () => {
    try {
      const data = await api.get(`/groups/${id}`)
      setGroup(data)
    } catch (e) {
      setError(e.message)
    }
  }

  const loadMembers = async () => {
    try {
      const data = await api.get(`/groups/${id}/members`)
      setMembers(data)
    } catch (e) {
      setError(e.message)
    }
  }

  const loadMessages = async () => {
    try {
      const data = await api.get(`/groups/${id}/messages`)
      setMessages(data)
      setTimeout(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight
        }
      }, 0)
    } catch (e) {
      setError(e.message)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    try {
      const msg = await api.post(`/groups/${id}/messages`, { content: text })
      setMessages((m) => [...m, msg])
      setText('')
      setTimeout(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight
        }
      }, 0)
    } catch (e) {
      setError(e.message)
    }
  }

  const searchUsers = async (q) => {
    setSearchQuery(q)
    if (!q) return setSearchResults([])
    try {
      const data = await api.get(`/users?q=${encodeURIComponent(q)}`)
      // Filter out existing members
      const memberIds = members.map(m => m.id)
      setSearchResults(data.filter(u => !memberIds.includes(u.id)))
    } catch (e) {
      setError(e.message)
    }
  }

  const addMember = async (userId) => {
    try {
      await api.post(`/groups/${id}/members`, { user_id: userId })
      setShowAddMember(false)
      setSearchQuery('')
      setSearchResults([])
      loadMembers()
    } catch (e) {
      setError(e.message)
    }
  }

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.del(`/groups/${id}/members/${userId}`)
      loadMembers()
    } catch (e) {
      setError(e.message)
    }
  }

  const toggleAdmin = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    const member = members.find(m => m.id === userId)
    
    // Confirmation dialog
    const action = newRole === 'admin' ? 'promote' : 'demote'
    const message = newRole === 'admin' 
      ? `Make ${member?.name} an admin?\n\nThey will be able to:\n• Add/remove members\n• Promote other admins\n• Manage group settings`
      : `Remove admin privileges from ${member?.name}?\n\nThey will become a regular member.`
    
    if (!confirm(message)) return
    
    setProcessingMember(userId)
    try {
      await api.put(`/groups/${id}/members/${userId}/role`, { role: newRole })
      await loadMembers()
      
      // Show success message
      const successMsg = newRole === 'admin' 
        ? `✓ ${member?.name} is now an admin!`
        : `✓ ${member?.name} is now a regular member`
      setError('') // Clear any previous errors
      setTimeout(() => alert(successMsg), 100)
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessingMember(null)
    }
  }

  const deleteGroup = async () => {
    if (!confirm('Delete this group? This action cannot be undone!')) return
    try {
      await api.del(`/groups/${id}`)
      navigate('/groups')
    } catch (e) {
      setError(e.message)
    }
  }

  const leaveGroup = async () => {
    if (!confirm('Leave this group?')) return
    try {
      await api.del(`/groups/${id}/members/${user.id}`)
      navigate('/groups')
    } catch (e) {
      setError(e.message)
    }
  }

  if (!group) return <div className="page"><div className="card">Loading...</div></div>

  const isAdmin = group.my_role === 'admin'

  return (
    <div className="page-container wide">
      <div className="page two-col chat-layout">
        {/* Members Sidebar */}
        <div className="card sidebar">
          <div className="chat-left-header row between" style={{alignItems:'center'}}>
            <div className="bold">Members ({members.length})</div>
            {isAdmin && (
              <button className="icon-btn" onClick={() => setShowAddMember(true)} title="Add member">
                ➕
              </button>
            )}
          </div>

          <div className="list" style={{marginTop:12}}>
            {members.map(member => (
              <div key={member.id} className="list-item">
                <img src={member.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
                <div style={{flex:1}}>
                  <div className="bold small">{member.name}</div>
                  {member.role === 'admin' && (
                    <span className="badge" style={{background:'var(--accent)', color:'#000', fontSize:10}}>
                      Admin
                    </span>
                  )}
                </div>
                {isAdmin && member.id !== group.created_by && member.id !== user.id && (
                  <div className="row gap">
                    <button 
                      className={`btn ${member.role === 'admin' ? 'btn-light' : 'btn-primary'}`}
                      style={{fontSize:11, padding:'4px 8px', minWidth:90}}
                      onClick={() => toggleAdmin(member.id, member.role)}
                      disabled={processingMember === member.id}
                    >
                      {processingMember === member.id 
                        ? '...' 
                        : member.role === 'admin' ? 'Remove Admin' : '⭐ Make Admin'}
                    </button>
                    <button 
                      className="btn" 
                      style={{fontSize:11, padding:'6px 12px', background:'#ef4444', color:'white', minWidth:70}}
                      disabled={processingMember === member.id}
                      onClick={() => removeMember(member.id)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="card chat">
          <div className="chat-header row between" style={{alignItems:'center', padding:12, borderBottom:'1px solid #2a2b55'}}>
            <div className="row gap" style={{alignItems:'center'}}>
              <button className="icon-btn" onClick={() => navigate('/groups')}>←</button>
              <img src={group.group_pic || 'https://via.placeholder.com/40'} className="avatar" />
              <div>
                <div className="bold">{group.name}</div>
                <div className="muted small">{members.length} members</div>
              </div>
            </div>
            <div className="row gap">
              <button className="btn btn-light" onClick={() => setShowMembers(!showMembers)}>
                Members
              </button>
              {isAdmin && (
                <button 
                  className="btn" 
                  style={{background:'#ef4444', color:'white'}}
                  onClick={deleteGroup}
                >
                  Delete Group
                </button>
              )}
              <button className="btn btn-light" onClick={leaveGroup}>
                Leave
              </button>
            </div>
          </div>

          <div className="messages" ref={messagesRef} style={{flex:1, overflowY:'auto', padding:16}}>
            {messages.map((m) => {
              const mine = m.sender_id === user?.id
              return (
                <div key={m.id} style={{marginBottom:16}}>
                  <div style={{display:'flex', gap:8, justifyContent: mine ? 'flex-end' : 'flex-start'}}>
                    {!mine && (
                      <img src={m.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
                    )}
                    <div style={{display:'flex', flexDirection:'column', alignItems: mine ? 'flex-end' : 'flex-start', maxWidth:'70%'}}>
                      {!mine && <div className="bold small" style={{marginBottom:4}}>{m.name}</div>}
                      <div style={{
                        background: mine ? '#1877f2' : 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        borderRadius: 16,
                        padding: '8px 12px',
                        wordBreak: 'break-word'
                      }}>
                        {m.content}
                      </div>
                      <div className="muted" style={{fontSize:11, marginTop:4}}>
                        {new Date(m.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={sendMessage} className="composer row gap">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (text.trim()) sendMessage(e)
                }
              }}
              placeholder="Type a message..."
              style={{flex:1}}
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card">
              <div className="row between" style={{marginBottom:16}}>
                <h3 style={{margin:0}}>Add Member</h3>
                <button className="icon-btn" onClick={() => setShowAddMember(false)}>✕</button>
              </div>

              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => searchUsers(e.target.value)}
                style={{marginBottom:12}}
              />

              <div className="list" style={{maxHeight:300, overflow:'auto'}}>
                {searchResults.map(u => (
                  <div key={u.id} className="list-item">
                    <img src={u.profile_pic || 'https://via.placeholder.com/32'} className="avatar" />
                    <div style={{flex:1}}>
                      <div className="bold small">{u.name}</div>
                      <div className="muted small">{u.email}</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => addMember(u.id)}>
                      Add
                    </button>
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <div className="muted small">No users found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error floating">{error}</div>}
    </div>
  )
}
