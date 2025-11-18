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
  const [attachedFile, setAttachedFile] = useState(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const messagesRef = useRef(null)
  const fileInputRef = useRef(null)

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
    if (!text.trim() && !attachedFile) return

    try {
      const formData = new FormData()
      formData.append('content', text || 'File attachment')
      if (attachedFile) {
        formData.append('file', attachedFile)
      }

      const msg = await api.postForm(`/groups/${id}/messages`, formData)
      setMessages((m) => [...m, msg])
      setText('')
      setAttachedFile(null)
      setShowAttachMenu(false)
      
      setTimeout(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight
        }
      }, 0)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }
    
    setAttachedFile(file)
    setShowAttachMenu(false)
  }

  const removeAttachedFile = () => {
    setAttachedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = (accept = '*') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept
      fileInputRef.current.click()
    }
  }

  const getFileIcon = (filename) => {
    if (!filename) return '📄'
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️'
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext)) return '🎥'
    if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return '🎵'
    if (['pdf'].includes(ext)) return '📕'
    if (['doc', 'docx'].includes(ext)) return '📝'
    if (['xls', 'xlsx'].includes(ext)) return '📊'
    if (['txt'].includes(ext)) return '📄'
    if (['zip', 'rar', '7z'].includes(ext)) return '📦'
    return '📄'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
    const member = members.find(m => m.id === userId)
    if (!member) return
    
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    
    // Check if current user has permission to modify this member
    if (!isCreator && member.role === 'admin') {
      alert('Only the group creator can modify other admins.')
      return
    }
    
    // Confirmation dialog
    const message = newRole === 'admin' 
      ? `Make ${member?.name} an admin?\n\nThey will be able to:\n• Add/remove members\n• Promote other admins\n• Manage group settings\n\nAre you sure?`
      : `Remove admin privileges from ${member?.name}?\n\nThey will become a regular member.`
    
    if (!confirm(message)) return
    
    setProcessingMember(userId)
    try {
      // First update the UI optimistically
      const updatedMembers = members.map(m => 
        m.id === userId ? { ...m, role: newRole } : m
      )
      setMembers(updatedMembers)
      
      // Then make the API call
      await api.put(`/groups/${id}/members/${userId}/role`, { 
        role: newRole 
      })
      
      // If current user was demoted, update their role in the group
      if (userId === user.id) {
        setGroup(prev => ({
          ...prev,
          my_role: newRole
        }))
      }
      
      // Show success message
      const successMsg = newRole === 'admin' 
        ? `✓ ${member?.name} is now an admin!`
        : `✓ ${member?.name} is now a regular member`
      setError('')
      
      // Reload members to ensure consistency with server
      await loadMembers()
      
    } catch (e) {
      // Revert UI on error
      await loadMembers()
      setError(e.response?.data?.error || e.message || 'Failed to update role')
    } finally {
      setProcessingMember(null)
    }
  }

  const deleteGroup = async () => {
    if (!isCreator) {
      alert('Only the group creator can delete the group.')
      return
    }
    
    if (!confirm('Delete this group? This action cannot be undone!')) return
    try {
      await api.del(`/groups/${id}`)
      navigate('/groups')
    } catch (e) {
      setError(e.message)
    }
  }

  const leaveGroup = async () => {
    // If user is the creator, they can't leave until they assign another admin
    if (isCreator) {
      const admins = members.filter(m => m.role === 'admin' && m.id !== user.id)
      if (admins.length === 0) {
        alert('You are the creator and the only admin. Please assign another admin before leaving.')
        return
      }
      
      const adminList = admins.map(a => `• ${a.name}`).join('\n')
      const confirmLeave = confirm(
        `You are the group creator. Before leaving, you must assign another admin.\n\n` +
        `Available admins to transfer ownership to:\n${adminList}\n\n` +
        `Click OK to continue and assign a new admin.`
      )
      
      if (!confirmLeave) return
      
      const adminId = admins[0].id // Default to first admin
      const confirmTransfer = confirm(
        `Transfer group ownership to ${admins[0].name}?\n` +
        `They will become the new group creator with full control.`
      )
      
      if (confirmTransfer) {
        try {
          await api.put(`/groups/${id}/transfer`, { new_owner_id: adminId })
          await api.del(`/groups/${id}/members/${user.id}`)
          navigate('/groups')
        } catch (e) {
          setError('Failed to transfer ownership: ' + e.message)
        }
      }
      return
    }
    
    // Regular member or admin (not creator) can leave directly
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
  const isCreator = group.created_by === user.id

  return (
    <div className="page-container wide">
      <div className="page two-col chat-layout">
        {/* Members Sidebar */}
        <div className="card sidebar">
          {/* Site Logo */}
          <div className="logo-section" style={{
            padding: '16px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '28px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🎓
              </span>
              ClassSocial
            </div>
            <div style={{
              fontSize: '12px',
              color: '#888',
              marginTop: '4px'
            }}>
              Group Chat
            </div>
          </div>

          <div className="chat-left-header row between" style={{alignItems:'center'}}>
            <div className="bold">
              Members ({members.length})
              {/* Debug info - remove in production */}
              <div className="muted small" style={{fontSize:10, marginTop:2}}>
                Role: {group.my_role || 'member'} | Creator: {isCreator ? 'Yes' : 'No'}
              </div>
            </div>
            {(isAdmin || isCreator) && (
              <button 
                className="btn btn-primary add-member-btn" 
                onClick={() => setShowAddMember(true)} 
                title="Add member"
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ➕ Add
              </button>
            )}
            {/* Always show button for testing - remove in production */}
            {!(isAdmin || isCreator) && (
              <button 
                className="btn btn-light add-member-btn" 
                onClick={() => setShowAddMember(true)} 
                title="Add member (Debug)"
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ➕ Debug Add
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
                {((isCreator) || (isAdmin && member.role !== 'admin')) && member.id !== group.created_by && member.id !== user.id && (
                  <div className="row gap" style={{gap:'6px'}}>
                    <button 
                      className={`btn ${member.role === 'admin' ? 'btn-light' : 'btn-primary'}`}
                      style={{fontSize:10, padding:'4px 8px', minWidth:70}}
                      onClick={() => toggleAdmin(member.id, member.role)}
                      disabled={processingMember === member.id}
                    >
                      {processingMember === member.id 
                        ? '...' 
                        : member.role === 'admin' ? '✕ Admin' : '⭐ Admin'}
                    </button>
                    <button 
                      className="btn" 
                      style={{fontSize:10, padding:'4px 8px', background:'#ef4444', color:'white', minWidth:60}}
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
        <div className="card chat group-chat-main">
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
              {(isAdmin || isCreator) && (
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
                        {/* File attachment rendering */}
                        {m.file_url && (
                          <div style={{ marginBottom: m.content !== 'File attachment' ? 8 : 0 }}>
                            {/* Image files */}
                            {/\.(jpg|jpeg|png|gif|webp)$/i.test(m.file_url) && (
                              <div>
                                <img 
                                  src={m.file_url} 
                                  alt="Shared image"
                                  style={{
                                    maxWidth: '300px',
                                    maxHeight: '200px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'block'
                                  }}
                                  onClick={() => window.open(m.file_url, '_blank')}
                                />
                              </div>
                            )}
                            
                            {/* Video files */}
                            {/\.(mp4|avi|mov|wmv|flv|webm)$/i.test(m.file_url) && (
                              <div>
                                <video 
                                  src={m.file_url}
                                  controls
                                  style={{
                                    maxWidth: '300px',
                                    maxHeight: '200px',
                                    borderRadius: '8px',
                                    display: 'block'
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Audio files */}
                            {/\.(mp3|wav|flac|aac|ogg)$/i.test(m.file_url) && (
                              <div>
                                <audio 
                                  src={m.file_url}
                                  controls
                                  style={{
                                    width: '250px'
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Other files */}
                            {!/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|wmv|flv|webm|mp3|wav|flac|aac|ogg)$/i.test(m.file_url) && (
                              <div style={{
                                padding: '8px 12px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              onClick={() => window.open(m.file_url, '_blank')}
                              >
                                <span style={{ fontSize: '20px' }}>
                                  {getFileIcon(m.file_url)}
                                </span>
                                <div>
                                  <div style={{ fontSize: '14px' }}>
                                    {m.file_url.split('/').pop()}
                                  </div>
                                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                                    Click to download
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Text content (only show if not default file attachment message) */}
                        {m.content && m.content !== 'File attachment' && (
                          <div>{m.content}</div>
                        )}
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

          <form onSubmit={sendMessage} className="composer">
            {/* File preview */}
            {attachedFile && (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>
                  {getFileIcon(attachedFile.name)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {attachedFile.name}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    {formatFileSize(attachedFile.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeAttachedFile}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="row gap" style={{ alignItems: 'flex-end' }}>
              {/* Attachment button */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  style={{
                    background: showAttachMenu ? '#3b82f6' : 'transparent',
                    color: showAttachMenu ? '#fff' : '#888',
                    padding: '8px',
                    marginBottom: '2px'
                  }}
                >
                  📎
                </button>
                
                {/* Attachment menu */}
                {showAttachMenu && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    backgroundColor: '#2a2b55',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    padding: '8px',
                    marginBottom: '8px',
                    minWidth: '160px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}>
                    <button
                      type="button"
                      onClick={() => openFileDialog('image/*')}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        padding: '8px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🖼️ Image
                    </button>
                    <button
                      type="button"
                      onClick={() => openFileDialog('video/*')}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        padding: '8px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🎥 Video
                    </button>
                    <button
                      type="button"
                      onClick={() => openFileDialog('audio/*')}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        padding: '8px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🎵 Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => openFileDialog('.txt,.doc,.docx,.pdf,.xls,.xlsx,.zip,.rar')}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        padding: '8px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      📄 Document
                    </button>
                    <button
                      type="button"
                      onClick={() => openFileDialog('*')}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        padding: '8px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      📎 Any File
                    </button>
                  </div>
                )}
              </div>

              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (text.trim() || attachedFile) sendMessage(e)
                  }
                }}
                placeholder="Type a message..."
                style={{ flex: 1 }}
              />
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!text.trim() && !attachedFile}
              >
                Send
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
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
