import React, { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

function VodPlayer({ currentVod, analysisData, setClips }) {
  const { vodId } = useParams()
  const playerRef = useRef(null)

  useEffect(() => {
    if (vodId && playerRef.current) {
      // Initialize Twitch player
      const script = document.createElement('script')
      script.src = 'https://player.twitch.tv/js/embed/v1.js'
      script.onload = () => {
        if (window.Twitch && window.Twitch.Player) {
          new window.Twitch.Player(playerRef.current, {
            video: vodId,
            parent: [window.location.hostname],
            width: '100%',
            height: '400px',
            allowfullscreen: true,
            autoplay: false
          })
        }
      }
      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    }
  }, [vodId])

  if (!currentVod && !vodId) {
    return (
      <div className="vod-player">
        <div className="card">
          <h2>No VOD Selected</h2>
          <p>Please select a VOD from the dashboard to begin playback and analysis.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="vod-player">
      <div className="grid grid-2">
        <div className="card">
          <h2>🎥 VOD Player</h2>
          <div ref={playerRef} style={{ width: '100%', minHeight: '400px', backgroundColor: '#000' }}>
            {/* Twitch player will be embedded here */}
          </div>
          
          {currentVod && (
            <div style={{ marginTop: '1rem' }}>
              <h3>{currentVod.title}</h3>
              <p><strong>Streamer:</strong> {currentVod.user_name}</p>
              <p><strong>Duration:</strong> {currentVod.duration}</p>
              <p><strong>Created:</strong> {new Date(currentVod.created_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2>📊 Real-time Analysis</h2>
          {analysisData ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h4>Analysis Summary:</h4>
                <p>💬 Total Messages: {analysisData.stats?.totalMessages || 0}</p>
                <p>⚡ Interaction Peaks: {analysisData.peaks?.length || 0}</p>
                <p>😀 Total Emotes: {analysisData.stats?.totalEmotes || 0}</p>
                <p>👥 Unique Chatters: {analysisData.stats?.uniqueUsers || 0}</p>
              </div>

              {analysisData.peaks?.length > 0 && (
                <div>
                  <h4>Quick Jump to Peaks:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {analysisData.peaks.map((peak, index) => (
                      <button
                        key={index}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                        onClick={() => {
                          // Jump to peak time in player
                          const timeInSeconds = peak.timestamp
                          // Note: Twitch player API would be used here to seek to specific time
                          console.log(`Jumping to peak at ${timeInSeconds}s`)
                        }}
                      >
                        Peak {index + 1} ({Math.floor(peak.timestamp / 60)}:{(peak.timestamp % 60).toString().padStart(2, '0')})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p>No analysis data available yet. Please run the analysis from the dashboard first.</p>
            </div>
          )}
        </div>
      </div>

      {analysisData?.peaks?.length > 0 && (
        <div className="card">
          <h2>🎬 Clip Generation Controls</h2>
          <p>Generate 60-second clips for each detected interaction peak. Clips will start 60 seconds before the peak and end at the peak moment.</p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn"
              onClick={async () => {
                try {
                  const response = await fetch('/api/generate-clips', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      vodId: currentVod?.id || vodId,
                      vodUrl: currentVod?.url,
                      peaks: analysisData.peaks
                    })
                  })

                  if (!response.ok) throw new Error('Clip generation failed')
                  
                  const result = await response.json()
                  alert(`Successfully generated ${result.clipsGenerated} clips!`)
                  
                  // Update clips list
                  if (setClips) {
                    const clipsResponse = await fetch('/api/clips')
                    const clipsData = await clipsResponse.json()
                    setClips(clipsData)
                  }
                } catch (error) {
                  console.error('Clip generation error:', error)
                  alert('Failed to generate clips. Please try again.')
                }
              }}
            >
              🎬 Generate All Clips ({analysisData.peaks.length})
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={() => {
                // Download analysis data as JSON
                const dataStr = JSON.stringify(analysisData, null, 2)
                const dataBlob = new Blob([dataStr], { type: 'application/json' })
                const url = URL.createObjectURL(dataBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = `analysis-${currentVod?.id || vodId}.json`
                link.click()
                URL.revokeObjectURL(url)
              }}
            >
              📥 Download Analysis Data
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VodPlayer