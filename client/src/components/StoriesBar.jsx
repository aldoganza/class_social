import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { getAvatarUrl } from '../lib/defaultAvatar'
import StoryViewer from './StoryViewer'

export default function StoriesBar() {
  const { user } = useAuth()
  const [grouped, setGrouped] = useState([])
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null)
  const [error, setError] = useState('')

  const loadStories = async () => {
    try {
      const data = await api.get('/stories')
      // Group stories by user
      const byUser = {}
      for (const story of data) {
        if (!byUser[story.user_id]) {
          byUser[story.user_id] = {
            user_id: story.user_id,
            name: story.name,
            profile_pic: story.profile_pic,
            stories: []
          }
        }
        byUser[story.user_id].stories.push(story)
      }
      
      const groups = Object.values(byUser)
      
      // Put logged user's story first
      if (user) {
        const myIndex = groups.findIndex(g => g.user_id === user.id)
        if (myIndex > 0) {
          const myStory = groups.splice(myIndex, 1)[0]
          groups.unshift(myStory)
        }
      }
      
      setGrouped(groups)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    loadStories()
  }, [])

  const openStories = (index) => {
    setSelectedGroupIndex(index)
  }

  const closeViewer = () => {
    setSelectedGroupIndex(null)
    loadStories() // Refresh after viewing
  }

  return (
    <>
      <div className="stories-bar">
        {error && <div className="error-msg">{error}</div>}
        
        <div className="stories-scroll">
          {grouped.map((group, index) => (
            <button
              key={group.user_id}
              className="story-avatar"
              onClick={() => openStories(index)}
            >
              <div className="story-ring">
                <img src={getAvatarUrl(group.profile_pic)} alt={group.name} />
              </div>
              <span className="story-name">{group.name}</span>
            </button>
          ))}
          
          {grouped.length === 0 && (
            <div className="no-stories">No stories yet</div>
          )}
        </div>
      </div>

      {selectedGroupIndex !== null && (
        <StoryViewer
          groups={grouped}
          startGroupIndex={selectedGroupIndex}
          onClose={closeViewer}
        />
      )}
    </>
  )
}
