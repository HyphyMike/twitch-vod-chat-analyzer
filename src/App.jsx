import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import VodPlayer from './components/VodPlayer'
import ClipsGallery from './components/ClipsGallery'
import Settings from './components/Settings'
import './App.css'

function App() {
  const [currentVod, setCurrentVod] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [clips, setClips] = useState([])

  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  currentVod={currentVod}
                  setCurrentVod={setCurrentVod}
                  analysisData={analysisData}
                  setAnalysisData={setAnalysisData}
                />
              } 
            />
            <Route 
              path="/player/:vodId" 
              element={
                <VodPlayer 
                  currentVod={currentVod}
                  analysisData={analysisData}
                  setClips={setClips}
                />
              } 
            />
            <Route 
              path="/clips" 
              element={<ClipsGallery clips={clips} />} 
            />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App