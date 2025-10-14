import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getAvatarUrl } from '../lib/defaultAvatar'
import StoryViewer from './StoryViewer'

export default function StoriesBar() {
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
      setGrouped(Object.values(byUser))
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
