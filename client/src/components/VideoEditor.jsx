import { useState, useRef, useEffect } from 'react'

export default function VideoEditor({ file, onSave, onCancel }) {
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const handleVideoLoad = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration
      setDuration(dur)
      setEndTime(dur)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      setCurrentTime(time)
      
      // Auto pause at end time
      if (time >= endTime) {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(startTime, Math.min(endTime, time))
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        // Start from beginning if at end
        if (currentTime >= endTime) {
          videoRef.current.currentTime = startTime
        }
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleStartChange = (e) => {
    const value = parseFloat(e.target.value)
    setStartTime(value)
    if (value >= endTime) {
      setEndTime(Math.min(duration, value + 1))
    }
    seekTo(value)
  }

  const handleEndChange = (e) => {
    const value = parseFloat(e.target.value)
    setEndTime(value)
    if (value <= startTime) {
      setStartTime(Math.max(0, value - 1))
    }
  }

  const exportTrimmedVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      // Create a new video blob with trimmed content
      // Note: This is a simplified approach. For production, you'd want to use ffmpeg.js or similar
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const video = videoRef.current
      
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // For now, we'll just return the original file with metadata about trim points
      // In a real implementation, you'd use ffmpeg.js to actually trim the video
      const trimmedFile = new File([file], file.name, {
        type: file.type,
        lastModified: Date.now()
      })
      
      // Add trim metadata
      trimmedFile.startTime = startTime
      trimmedFile.endTime = endTime
      trimmedFile.trimDuration = endTime - startTime
      
      onSave(trimmedFile)
    } catch (error) {
      console.error('Error exporting video:', error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const selectedDuration = endTime - startTime

  return (
    <div className="video-editor card">
      <div className="row between" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Edit Video</h3>
        <button className="icon-btn" onClick={onCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Video Preview */}
      <div className="video-preview" style={{ position: 'relative', marginBottom: 16 }}>
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={handleVideoLoad}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{
            width: '100%',
            maxHeight: '300px',
            backgroundColor: '#000',
            borderRadius: '8px'
          }}
          playsInline
        />
        
        {/* Play/Pause Overlay */}
        <div 
          className="play-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: isPlaying ? 'transparent' : 'rgba(0,0,0,0.3)',
          }}
          onClick={togglePlay}
        >
          {!isPlaying && (
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="timeline-controls" style={{ marginBottom: 16 }}>
        <div className="timeline" style={{ position: 'relative', marginBottom: 12 }}>
          {/* Progress bar background */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            position: 'relative'
          }}>
            {/* Selected range */}
            <div style={{
              position: 'absolute',
              left: `${(startTime / duration) * 100}%`,
              width: `${((endTime - startTime) / duration) * 100}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: '4px'
            }} />
            
            {/* Current time indicator */}
            <div style={{
              position: 'absolute',
              left: `${(currentTime / duration) * 100}%`,
              top: '-2px',
              width: '2px',
              height: '12px',
              backgroundColor: '#ef4444',
              borderRadius: '1px'
            }} />
          </div>
        </div>

        {/* Time inputs */}
        <div className="row gap" style={{ alignItems: 'center', marginBottom: 12 }}>
          <div className="col" style={{ flex: 1 }}>
            <label className="small">Start Time</label>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={startTime}
              onChange={handleStartChange}
              style={{ width: '100%' }}
            />
            <div className="small muted">{formatTime(startTime)}</div>
          </div>
          
          <div className="col" style={{ flex: 1 }}>
            <label className="small">End Time</label>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={endTime}
              onChange={handleEndChange}
              style={{ width: '100%' }}
            />
            <div className="small muted">{formatTime(endTime)}</div>
          </div>
        </div>

        {/* Duration info */}
        <div className="row between" style={{ marginBottom: 16 }}>
          <div className="small">
            <strong>Selected:</strong> {formatTime(selectedDuration)}
          </div>
          <div className="small muted">
            Total: {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="row gap">
        <button className="btn btn-light" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </button>
        <button 
          className="btn btn-primary" 
          onClick={exportTrimmedVideo}
          style={{ flex: 1 }}
          disabled={selectedDuration < 0.5}
        >
          Use Trimmed Video
        </button>
      </div>

      {/* Hidden canvas for video processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
