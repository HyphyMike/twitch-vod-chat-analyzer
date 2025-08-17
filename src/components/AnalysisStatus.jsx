import React from 'react'

function AnalysisStatus({ isAnalyzing, progress, vodSelected, analysisComplete }) {
  const getStatus = () => {
    if (!vodSelected) {
      return { text: 'Select a VOD to begin analysis', icon: '📺', color: '#adadb8' }
    }
    if (isAnalyzing) {
      return { text: 'Analyzing chat data...', icon: '⚡', color: '#ffb800' }
    }
    if (analysisComplete) {
      return { text: 'Analysis complete!', icon: '✅', color: '#00ff88' }
    }
    return { text: 'Ready to analyze', icon: '🚀', color: '#9147ff' }
  }

  const status = getStatus()

  return (
    <div className="analysis-status">
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginBottom: '1rem'
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>{status.icon}</span>
        <span style={{ color: status.color, fontWeight: 'bold' }}>
          {status.text}
        </span>
      </div>

      {isAnalyzing && (
        <div className="progress-container">
          <div 
            className="progress-bar"
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#464649',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div 
              className="progress-fill"
              style={{
                height: '100%',
                backgroundColor: '#9147ff',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }}
            />
          </div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#adadb8' }}>
            {progress}% complete
          </div>
        </div>
      )}

      {analysisComplete && (
        <div style={{ fontSize: '0.9rem', color: '#adadb8' }}>
          Chat analysis completed successfully. You can now generate clips or view detailed analysis data.
        </div>
      )}
    </div>
  )
}

export default AnalysisStatus