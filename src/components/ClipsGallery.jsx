import React, { useState, useEffect } from 'react'

function ClipsGallery({ clips: propClips }) {
  const [clips, setClips] = useState(propClips || [])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClip, setSelectedClip] = useState(null)

  useEffect(() => {
    loadClips()
  }, [])

  const loadClips = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/clips')
      if (response.ok) {
        const clipsData = await response.json()
        setClips(clipsData)
      }
    } catch (error) {
      console.error('Error loading clips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadClip = async (clipId, filename) => {
    try {
      const response = await fetch(`/api/clips/${clipId}/download`)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download clip. Please try again.')
    }
  }

  const handleDeleteClip = async (clipId) => {
    if (!confirm('Are you sure you want to delete this clip?')) return

    try {
      const response = await fetch(`/api/clips/${clipId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Delete failed')

      setClips(clips.filter(clip => clip.id !== clipId))
      if (selectedClip?.id === clipId) {
        setSelectedClip(null)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete clip. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="clips-gallery">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="clips-gallery">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>🎬 Generated Clips ({clips.length})</h2>
          <button className="btn btn-secondary" onClick={loadClips}>
            🔄 Refresh
          </button>
        </div>

        {clips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#adadb8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
            <h3>No clips generated yet</h3>
            <p>Generate clips by analyzing VODs on the dashboard first.</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="clip-card"
                style={{
                  backgroundColor: '#262626',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: selectedClip?.id === clip.id ? '2px solid #9147ff' : '1px solid #464649',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedClip(clip)}
              >
                {/* Clip thumbnail/preview */}
                <div 
                  style={{
                    height: '160px',
                    backgroundColor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {clip.thumbnailUrl ? (
                    <img 
                      src={clip.thumbnailUrl} 
                      alt="Clip thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ color: '#adadb8', fontSize: '2rem' }}>🎥</div>
                  )}
                  
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}
                  >
                    60s
                  </div>
                </div>

                {/* Clip info */}
                <div style={{ padding: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                    {clip.title || `Clip #${clip.id}`}
                  </h4>
                  
                  <div style={{ fontSize: '0.9rem', color: '#adadb8', marginBottom: '0.5rem' }}>
                    <div>🎯 Peak at {Math.floor(clip.peakTime / 60)}:{(clip.peakTime % 60).toString().padStart(2, '0')}</div>
                    <div>💬 {clip.messageCount} messages</div>
                    <div>📅 {new Date(clip.createdAt).toLocaleDateString()}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      className="btn"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', flex: 1 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadClip(clip.id, clip.filename || `clip-${clip.id}.mp4`)
                      }}
                    >
                      📥 Download
                    </button>
                    
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClip(clip.id)
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clip Preview Modal */}
      {selectedClip && (
        <div 
          className="clip-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedClip(null)}
        >
          <div 
            className="modal-content"
            style={{
              backgroundColor: '#18181b',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80%',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>{selectedClip.title || `Clip #${selectedClip.id}`}</h3>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedClip(null)}
              >
                ✕
              </button>
            </div>

            {/* Video player placeholder */}
            <div 
              style={{
                width: '100%',
                height: '400px',
                backgroundColor: '#000',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              {selectedClip.videoUrl ? (
                <video 
                  controls 
                  style={{ width: '100%', height: '100%' }}
                  src={selectedClip.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div style={{ color: '#adadb8', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎥</div>
                  <div>Video preview not available</div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Peak Time:</strong> {Math.floor(selectedClip.peakTime / 60)}:{(selectedClip.peakTime % 60).toString().padStart(2, '0')}
              </div>
              <div>
                <strong>Messages:</strong> {selectedClip.messageCount}
              </div>
              <div>
                <strong>Intensity:</strong> {selectedClip.intensity?.toFixed(1) || 'N/A'}
              </div>
              <div>
                <strong>Created:</strong> {new Date(selectedClip.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn"
                onClick={() => handleDownloadClip(selectedClip.id, selectedClip.filename || `clip-${selectedClip.id}.mp4`)}
              >
                📥 Download Clip
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteClip(selectedClip.id)}
              >
                🗑️ Delete Clip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClipsGallery