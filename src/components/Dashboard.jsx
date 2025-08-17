import React, { useState, useEffect } from 'react'
import VodSearch from './VodSearch'
import AnalysisStatus from './AnalysisStatus'
import ChatAnalysisChart from './ChatAnalysisChart'

function Dashboard({ currentVod, setCurrentVod, analysisData, setAnalysisData }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const handleVodSelect = async (vodData) => {
    setCurrentVod(vodData)
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Start chat analysis
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vodId: vodData.id, vodUrl: vodData.url }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setAnalysisData(data)
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to analyze VOD. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleStartClipGeneration = async () => {
    if (!analysisData?.peaks?.length) {
      alert('No interaction peaks found to generate clips.')
      return
    }

    try {
      const response = await fetch('/api/generate-clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vodId: currentVod.id,
          vodUrl: currentVod.url,
          peaks: analysisData.peaks
        }),
      })

      if (!response.ok) {
        throw new Error('Clip generation failed')
      }

      const result = await response.json()
      alert(`Successfully generated ${result.clipsGenerated} clips!`)
    } catch (error) {
      console.error('Clip generation error:', error)
      alert('Failed to generate clips. Please try again.')
    }
  }

  return (
    <div className="dashboard">
      <div className="grid grid-2">
        <div className="card">
          <h2>🔍 VOD Selection</h2>
          <VodSearch onVodSelect={handleVodSelect} />
          
          {currentVod && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Selected VOD:</h3>
              <p><strong>Title:</strong> {currentVod.title}</p>
              <p><strong>Streamer:</strong> {currentVod.user_name}</p>
              <p><strong>Duration:</strong> {currentVod.duration}</p>
              <p><strong>Created:</strong> {new Date(currentVod.created_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2>📊 Analysis Status</h2>
          <AnalysisStatus 
            isAnalyzing={isAnalyzing}
            progress={analysisProgress}
            vodSelected={!!currentVod}
            analysisComplete={!!analysisData}
          />
          
          {analysisData && (
            <div style={{ marginTop: '1rem' }}>
              <button 
                className="btn" 
                onClick={handleStartClipGeneration}
                disabled={!analysisData?.peaks?.length}
              >
                🎬 Generate Clips ({analysisData.peaks?.length || 0} peaks found)
              </button>
            </div>
          )}
        </div>
      </div>

      {analysisData && (
        <div className="card">
          <h2>📈 Chat Interaction Analysis</h2>
          <ChatAnalysisChart data={analysisData} />
        </div>
      )}
    </div>
  )
}

export default Dashboard