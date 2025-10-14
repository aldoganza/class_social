import { useEffect, useState, useRef } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { getAvatarUrl } from '../lib/defaultAvatar'

export default function StoryViewer({ groups, startGroupIndex, onClose }) {
  const { user } = useAuth()
  const [groupIndex, setGroupIndex] = useState(startGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [replyText, setReplyText] = useState('')
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const progressInterval = useRef(null)

  const currentGroup = groups[groupIndex]
  const currentStory = currentGroup?.stories[storyIndex]
  const STORY_DURATION = 5000 // 5 seconds

  // Mark story as viewed
  useEffect(() => {
    if (currentStory) {
      api.post(`/stories/${currentStory.id}/view`, {}).catch(() => {})
    }
  }, [currentStory?.id])

  // Progress bar animation
  useEffect(() => {
    if (!currentStory || isPaused) return

    setProgress(0)
    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100)
      setProgress(newProgress)

      if (newProgress >= 100) {
        nextStory()
      } else {
        progressInterval.current = requestAnimationFrame(updateProgress)
      }
    }

    progressInterval.current = requestAnimationFrame(updateProgress)

    return () => {
      if (progressInterval.current) {
        cancelAnimationFrame(progressInterval.current)
      }
    }
  }, [currentStory?.id, isPaused])

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') nextStory()
      if (e.key === 'ArrowLeft') prevStory()
      if (e.key === ' ') {
        e.preventDefault()
        setIsPaused(p => !p)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [groupIndex, storyIndex])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const nextStory = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1)
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1)
      setStoryIndex(0)
    } else {
      onClose()
    }
  }

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1)
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1)
      setStoryIndex(groups[groupIndex - 1].stories.length - 1)
    }
  }

  const toggleLike = async () => {
    if (!currentStory) return
    try {
      if (currentStory.liked_by_me) {
        await api.del(`/stories/${currentStory.id}/like`)
        currentStory.liked_by_me = false
      } else {
        await api.post(`/stories/${currentStory.id}/like`, {})
        currentStory.liked_by_me = true
      }
    } catch (e) {
      console.error(e)
    }
  }

  const sendReply = async () => {
    if (!replyText.trim() || !currentStory) return
    try {
      await api.post(`/messages/${currentGroup.user_id}`, {
        content: replyText.trim()
      })
      setReplyText('')
    } catch (e) {
      console.error(e)
    }
  }

  const deleteStory = async () => {
    if (!currentStory || !window.confirm('Delete this story?')) return
    try {
      await api.del(`/stories/${currentStory.id}`)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
    if (seconds < 60) return 'now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  if (!currentStory) return null

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="story-progress-bars">
          {currentGroup.stories.map((_, idx) => (
            <div key={idx} className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{
                  width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-header">
          <div className="story-user-info">
            <img src={getAvatarUrl(currentGroup.profile_pic)} alt={currentGroup.name} className="story-avatar-small" />
            <span className="story-username">{currentGroup.name}</span>
            <span className="story-time">{timeAgo(currentStory.created_at)}</span>
          </div>
          <div className="story-controls">
            <button className="story-btn" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? '▶' : '⏸'}
            </button>
            {(currentStory.media_type === 'video' || currentStory.audio_url) && (
              <button className="story-btn" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? '🔇' : '🔊'}
              </button>
            )}
            {user && user.id === currentStory.user_id && (
              <button className="story-btn" onClick={deleteStory}>
                🗑️
              </button>
            )}
            <button className="story-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Media */}
        <div className="story-media-container">
          {currentStory.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="story-media"
            />
          ) : (
            <>
              <img
                src={currentStory.media_url}
                alt="Story"
                className="story-media"
              />
              {/* Audio for photo stories */}
              {currentStory.audio_url && (
                <audio
                  ref={audioRef}
                  src={currentStory.audio_url}
                  autoPlay
                  loop
                  muted={isMuted}
                />
              )}
            </>
          )}

          {/* Caption overlay */}
          {currentStory.caption && (
            <div className="story-caption-overlay">
              <p>{currentStory.caption}</p>
            </div>
          )}

          {/* Navigation areas */}
          <div className="story-nav-left" onClick={prevStory} />
          <div className="story-nav-right" onClick={nextStory} />
        </div>

        {/* Footer - Reply & Like */}
        <div className="story-footer">
          <input
            type="text"
            className="story-reply-input"
            placeholder={`Reply to ${currentGroup.name}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                sendReply()
              }
            }}
          />
          <button
            className={`story-like-btn ${currentStory.liked_by_me ? 'liked' : ''}`}
            onClick={toggleLike}
          >
            ❤️
          </button>
        </div>
      </div>
    </div>
  )
}
