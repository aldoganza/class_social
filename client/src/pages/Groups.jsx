import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Groups() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', description: '', group_pic: null })

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const data = await api.get('/groups')
      setGroups(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const createGroup = async (e) => {
    e.preventDefault()
    if (!newGroup.name.trim()) {
      setError('Group name is required')
      return
    }

    try {
      const form = new FormData()
      form.append('name', newGroup.name)
      form.append('description', newGroup.description)
      if (newGroup.group_pic) form.append('group_pic', newGroup.group_pic)

      await api.post('/groups', form)
      setNewGroup({ name: '', description: '', group_pic: null })
      setShowCreateModal(false)
      loadGroups()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="page">
      <div className="card row between" style={{alignItems:'center'}}>
        <h2 style={{margin:0}}>Groups</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ Create Group
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading && <div className="card">Loading...</div>}

      {!loading && groups.length === 0 && (
        <div className="card">
          <div className="muted">No groups yet. Create one to get started!</div>
        </div>
      )}

      <div className="list">
        {groups.map(group => (
          <div 
            key={group.id} 
            className="card list-item" 
            style={{cursor:'pointer'}}
            onClick={() => navigate(`/groups/${group.id}`)}
          >
            <img 
              src={group.group_pic || 'https://via.placeholder.com/48'} 
              className="avatar-md" 
              alt={group.name}
            />
            <div style={{flex:1}}>
              <div className="row between">
                <div className="bold">{group.name}</div>
                <div className="row gap" style={{alignItems:'center', gap:'8px'}}>
                  {group.my_role === 'admin' && (
                    <span className="badge" style={{background:'var(--accent)', color:'#000'}}>Admin</span>
                  )}
                  {group.has_unread_messages && (
                    <div 
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#1877f2',
                        flexShrink: 0
                      }}
                      title="New messages"
                    />
                  )}
                </div>
              </div>
              <div className="muted small">{group.member_count} members</div>
              {group.last_message && (
                <div className="small" style={{marginTop:4}}>
                  {group.last_message.slice(0, 50)}{group.last_message.length > 50 ? '...' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card">
              <div className="row between" style={{marginBottom:16}}>
                <h3 style={{margin:0}}>Create New Group</h3>
                <button className="icon-btn" onClick={() => setShowCreateModal(false)}>✕</button>
              </div>
              
              <form onSubmit={createGroup} className="form">
                <label>
                  <span className="bold">Group Name *</span>
                  <input 
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    placeholder="Enter group name"
                    required
                  />
                </label>

                <label>
                  <span className="bold">Description</span>
                  <textarea 
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    placeholder="What's this group about?"
                    rows={3}
                  />
                </label>

                <label>
                  <span className="bold">Group Picture</span>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewGroup({...newGroup, group_pic: e.target.files[0]})}
                  />
                </label>

                <div className="row gap" style={{marginTop:16}}>
                  <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
