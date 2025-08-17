import React from 'react'

function ChatAnalysisChart({ data }) {
  if (!data || !data.timeline) {
    return <div>No analysis data available</div>
  }

  const { timeline, peaks, stats } = data
  const maxMessages = Math.max(...timeline.map(point => point.messageCount))

  return (
    <div className="chat-analysis-chart">
      {/* Stats Summary */}
      <div className="stats-summary" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div className="stat-card" style={{ 
          backgroundColor: '#262626', 
          padding: '1rem', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', color: '#9147ff' }}>📊</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.totalMessages || 0}</div>
          <div style={{ color: '#adadb8' }}>Total Messages</div>
        </div>
        <div className="stat-card" style={{ 
          backgroundColor: '#262626', 
          padding: '1rem', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', color: '#00ff88' }}>⚡</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{peaks?.length || 0}</div>
          <div style={{ color: '#adadb8' }}>Interaction Peaks</div>
        </div>
        <div className="stat-card" style={{ 
          backgroundColor: '#262626', 
          padding: '1rem', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', color: '#ffb800' }}>😀</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.totalEmotes || 0}</div>
          <div style={{ color: '#adadb8' }}>Total Emotes</div>
        </div>
        <div className="stat-card" style={{ 
          backgroundColor: '#262626', 
          padding: '1rem', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', color: '#ff6b6b' }}>👥</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.uniqueUsers || 0}</div>
          <div style={{ color: '#adadb8' }}>Unique Chatters</div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="timeline-chart">
        <h3 style={{ marginBottom: '1rem' }}>Message Activity Timeline</h3>
        <div 
          className="chart-container"
          style={{
            height: '300px',
            backgroundColor: '#262626',
            borderRadius: '8px',
            padding: '1rem',
            position: 'relative'
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 800 260">
            {/* Chart Grid */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 52}
                x2="800"
                y2={i * 52}
                stroke="#464649"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}

            {/* Chart Line */}
            <polyline
              fill="none"
              stroke="#9147ff"
              strokeWidth="2"
              points={timeline.map((point, index) => {
                const x = (index / (timeline.length - 1)) * 800
                const y = 260 - (point.messageCount / maxMessages) * 260
                return `${x},${y}`
              }).join(' ')}
            />

            {/* Peak Markers */}
            {peaks && peaks.map((peak, index) => {
              const timelineIndex = timeline.findIndex(point => point.timestamp === peak.timestamp)
              if (timelineIndex === -1) return null
              
              const x = (timelineIndex / (timeline.length - 1)) * 800
              const y = 260 - (peak.messageCount / maxMessages) * 260
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="#ff6b6b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y - 15}
                    fill="#ff6b6b"
                    fontSize="12"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    Peak {index + 1}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '0.5rem',
          fontSize: '0.8rem',
          color: '#adadb8'
        }}>
          <span>Start</span>
          <span>Middle</span>
          <span>End</span>
        </div>
      </div>

      {/* Peak Details */}
      {peaks && peaks.length > 0 && (
        <div className="peaks-details" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Interaction Peaks Found</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {peaks.map((peak, index) => (
              <div 
                key={index}
                className="peak-card"
                style={{
                  backgroundColor: '#262626',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '2px solid #ff6b6b'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#ff6b6b', marginBottom: '0.5rem' }}>
                  Peak #{index + 1}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#adadb8' }}>
                  <div>📍 Time: {Math.floor(peak.timestamp / 60)}:{(peak.timestamp % 60).toString().padStart(2, '0')}</div>
                  <div>💬 Messages: {peak.messageCount}</div>
                  <div>😀 Emotes: {peak.emoteCount}</div>
                  <div>🔥 Intensity: {peak.intensity.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatAnalysisChart