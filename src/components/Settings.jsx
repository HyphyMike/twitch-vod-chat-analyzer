import React, { useState, useEffect } from 'react'

function Settings() {
  const [settings, setSettings] = useState({
    sensitivity: {
      messageThreshold: 50,
      emoteThreshold: 10,
      peakWindowSize: 30,
      minimumPeakDistance: 120,
      // New enhanced settings
      sensitivityMode: 'balanced',
      useAdaptiveThresholds: true,
      multiWindowAnalysis: true,
      contentAnalysis: true,
      windowSizes: [10, 30, 60],
      excitementKeywords: ['POGGERS', 'KEKW', 'LUL', 'OMEGALUL', 'WOW', 'AMAZING', 'INSANE', 'HOLY', 'POG', 'HYPE', '5Head', 'EZ', 'CLUTCH'],
      disallowedTerms: ['!drop', '!giveaway', 'bot', 'spam', 'scam', 'fake', 'subscribe to me', 'follow me', 'check out my', 'view my channel']
    },
    clipGeneration: {
      duration: 60,
      startOffset: 60,
      format: 'mp4',
      quality: 'medium'
    },
    twitch: {
      clientId: '',
      clientSecret: ''
    }
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...settings, ...data })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('')
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSaveStatus('Settings saved successfully!')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        sensitivity: {
          messageThreshold: 50,
          emoteThreshold: 10,
          peakWindowSize: 30,
          minimumPeakDistance: 120,
          sensitivityMode: 'balanced',
          useAdaptiveThresholds: true,
          multiWindowAnalysis: true,
          contentAnalysis: true,
          windowSizes: [10, 30, 60],
          excitementKeywords: ['POGGERS', 'KEKW', 'LUL', 'OMEGALUL', 'WOW', 'AMAZING', 'INSANE', 'HOLY', 'POG', 'HYPE', '5Head', 'EZ', 'CLUTCH'],
          disallowedTerms: ['!drop', '!giveaway', 'bot', 'spam', 'scam', 'fake', 'subscribe to me', 'follow me', 'check out my', 'view my channel']
        },
        clipGeneration: {
          duration: 60,
          startOffset: 60,
          format: 'mp4',
          quality: 'medium'
        },
        twitch: {
          clientId: '',
          clientSecret: ''
        }
      })
      setSaveStatus('Settings reset to defaults')
    }
  }

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  return (
    <div className="settings">
      <div className="card">
        <h2>⚙️ Settings</h2>
        <p style={{ color: '#adadb8', marginBottom: '2rem' }}>
          Configure chat analysis sensitivity and clip generation parameters.
        </p>

        <div className="settings-sections">
          {/* Chat Analysis Sensitivity */}
          <div className="settings-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#9147ff' }}>📊 Chat Analysis Sensitivity</h3>
            
            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Message Threshold (messages per minute)
              </label>
              <input
                type="number"
                className="input"
                value={settings.sensitivity.messageThreshold}
                onChange={(e) => updateSetting('sensitivity', 'messageThreshold', parseInt(e.target.value))}
                min="1"
                max="1000"
                style={{ width: '200px' }}
              />
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                Minimum messages per minute to consider as high activity
              </div>
            </div>

            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Emote Threshold (emotes per minute)
              </label>
              <input
                type="number"
                className="input"
                value={settings.sensitivity.emoteThreshold}
                onChange={(e) => updateSetting('sensitivity', 'emoteThreshold', parseInt(e.target.value))}
                min="1"
                max="100"
                style={{ width: '200px' }}
              />
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                Minimum emotes per minute to boost interaction score
              </div>
            </div>

            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Peak Window Size (seconds)
              </label>
              <input
                type="number"
                className="input"
                value={settings.sensitivity.peakWindowSize}
                onChange={(e) => updateSetting('sensitivity', 'peakWindowSize', parseInt(e.target.value))}
                min="10"
                max="300"
                style={{ width: '200px' }}
              />
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                Time window for averaging activity to detect peaks
              </div>
            </div>

            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Minimum Peak Distance (seconds)
              </label>
              <input
                type="number"
                className="input"
                value={settings.sensitivity.minimumPeakDistance}
                onChange={(e) => updateSetting('sensitivity', 'minimumPeakDistance', parseInt(e.target.value))}
                min="30"
                max="600"
                style={{ width: '200px' }}
              />
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                Minimum time between detected peaks to avoid duplicates
              </div>
            </div>

            {/* Enhanced Analysis Settings */}
            <div style={{ marginTop: '1.5rem', marginBottom: '1rem', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #464649' }}>
              <h4 style={{ marginBottom: '1rem', color: '#ffb800' }}>🚀 Enhanced Analysis Settings</h4>
              
              <div className="setting-item" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Sensitivity Mode
                </label>
                <select
                  className="input"
                  value={settings.sensitivity.sensitivityMode}
                  onChange={(e) => updateSetting('sensitivity', 'sensitivityMode', e.target.value)}
                  style={{ width: '200px' }}
                >
                  <option value="conservative">Conservative - Fewer, high-confidence peaks</option>
                  <option value="balanced">Balanced - Good mix of accuracy and detection</option>
                  <option value="aggressive">Aggressive - More peaks, may include false positives</option>
                </select>
                <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                  Controls how sensitive the peak detection algorithm is
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.sensitivity.useAdaptiveThresholds}
                    onChange={(e) => updateSetting('sensitivity', 'useAdaptiveThresholds', e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span>Use Adaptive Thresholds</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.sensitivity.multiWindowAnalysis}
                    onChange={(e) => updateSetting('sensitivity', 'multiWindowAnalysis', e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span>Multi-Window Analysis</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.sensitivity.contentAnalysis}
                    onChange={(e) => updateSetting('sensitivity', 'contentAnalysis', e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span>Content Analysis</span>
                </label>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginBottom: '1rem' }}>
                <div>• <strong>Adaptive Thresholds:</strong> Automatically adjust detection sensitivity based on stream size and activity</div>
                <div>• <strong>Multi-Window Analysis:</strong> Use multiple time windows (10s, 30s, 60s) for better detection</div>
                <div>• <strong>Content Analysis:</strong> Analyze message content for excitement keywords, caps, and spam detection</div>
              </div>

              {settings.sensitivity.contentAnalysis && (
                <div className="setting-item" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Excitement Keywords
                  </label>
                  <textarea
                    className="input"
                    value={settings.sensitivity.excitementKeywords.join(', ')}
                    onChange={(e) => updateSetting('sensitivity', 'excitementKeywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                    placeholder="Enter keywords separated by commas"
                    style={{ width: '100%', height: '60px', resize: 'vertical' }}
                  />
                  <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                    Keywords that indicate excitement in chat (e.g., POGGERS, KEKW, WOW)
                  </div>
                </div>
              )}

              {settings.sensitivity.contentAnalysis && (
                <div className="setting-item" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Disallowed Terms
                  </label>
                  <textarea
                    className="input"
                    value={(settings.sensitivity.disallowedTerms || []).join(', ')}
                    onChange={(e) => updateSetting('sensitivity', 'disallowedTerms', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                    placeholder="Enter terms to filter out, separated by commas"
                    style={{ width: '100%', height: '60px', resize: 'vertical' }}
                  />
                  <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                    Terms that reduce excitement scoring and help filter spam/toxic content
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clip Generation Settings */}
          <div className="settings-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#9147ff' }}>🎬 Clip Generation</h3>
            
            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Clip Duration (seconds)
              </label>
              <input
                type="number"
                className="input"
                value={settings.clipGeneration.duration}
                onChange={(e) => updateSetting('clipGeneration', 'duration', parseInt(e.target.value))}
                min="30"
                max="300"
                style={{ width: '200px' }}
              />
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                Total length of generated clips
              </div>
            </div>

            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Start Offset (seconds before peak)
              </label>
              <input
                type="number"
                className="input"
                value={settings.clipGeneration.startOffset}
                onChange={(e) => updateSetting('clipGeneration', 'startOffset', parseInt(e.target.value))}
                min="0"
                max="120"
                style={{ width: '200px' }}
              />
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                How many seconds before the peak to start the clip
              </div>
            </div>

            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Video Format
              </label>
              <select
                className="input"
                value={settings.clipGeneration.format}
                onChange={(e) => updateSetting('clipGeneration', 'format', e.target.value)}
                style={{ width: '200px' }}
              >
                <option value="mp4">MP4 (H.264)</option>
                <option value="webm">WebM (VP9)</option>
                <option value="avi">AVI</option>
              </select>
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                Output video format for generated clips
              </div>
            </div>

            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Video Quality
              </label>
              <select
                className="input"
                value={settings.clipGeneration.quality}
                onChange={(e) => updateSetting('clipGeneration', 'quality', e.target.value)}
                style={{ width: '200px' }}
              >
                <option value="low">Low (480p)</option>
                <option value="medium">Medium (720p)</option>
                <option value="high">High (1080p)</option>
                <option value="source">Source Quality</option>
              </select>
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                Quality setting for generated clips
              </div>
            </div>
          </div>

          {/* Twitch API Settings */}
          <div className="settings-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#9147ff' }}>🔑 Twitch API Configuration</h3>
            
            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Client ID
              </label>
              <input
                type="text"
                className="input"
                value={settings.twitch.clientId}
                onChange={(e) => updateSetting('twitch', 'clientId', e.target.value)}
                placeholder="Enter your Twitch Client ID"
                style={{ width: '100%', maxWidth: '400px' }}
              />
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                Required for accessing Twitch API and chat data
              </div>
            </div>

            <div className="setting-item" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Client Secret
              </label>
              <input
                type="password"
                className="input"
                value={settings.twitch.clientSecret}
                onChange={(e) => updateSetting('twitch', 'clientSecret', e.target.value)}
                placeholder="Enter your Twitch Client Secret"
                style={{ width: '100%', maxWidth: '400px' }}
              />
              <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '0.25rem' }}>
                Keep this secret and secure. Never share publicly.
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#262626', borderRadius: '8px', marginTop: '1rem' }}>
              <h4 style={{ color: '#ffb800', marginBottom: '0.5rem' }}>📋 How to get Twitch API credentials:</h4>
              <ol style={{ fontSize: '0.9rem', color: '#adadb8', paddingLeft: '1.5rem' }}>
                <li>Go to <a href="https://dev.twitch.tv/console" target="_blank" rel="noopener noreferrer" style={{ color: '#9147ff' }}>dev.twitch.tv/console</a></li>
                <li>Log in with your Twitch account</li>
                <li>Click "Register Your Application"</li>
                <li>Fill in the application details</li>
                <li>Set OAuth Redirect URL to: <code style={{ backgroundColor: '#18181b', padding: '2px 4px', borderRadius: '2px' }}>http://localhost:3001/auth/callback</code></li>
                <li>Select category: "Application Integration"</li>
                <li>Copy the Client ID and generate a Client Secret</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #464649' }}>
          <button 
            className="btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '💾 Saving...' : '💾 Save Settings'}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isSaving}
          >
            🔄 Reset to Defaults
          </button>
        </div>

        {saveStatus && (
          <div 
            style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              borderRadius: '4px',
              backgroundColor: saveStatus.includes('successfully') ? '#00ff8820' : '#ff6b6b20',
              color: saveStatus.includes('successfully') ? '#00ff88' : '#ff6b6b',
              border: `1px solid ${saveStatus.includes('successfully') ? '#00ff88' : '#ff6b6b'}`
            }}
          >
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings