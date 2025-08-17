import express from 'express'
import fs from 'fs'
import path from 'path'

const router = express.Router()
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json')

// Default settings
const defaultSettings = {
  sensitivity: {
    messageThreshold: 50,
    emoteThreshold: 10,
    peakWindowSize: 30,
    minimumPeakDistance: 120
  },
  clipGeneration: {
    duration: 60,
    startOffset: 60,
    format: 'mp4',
    quality: 'medium'
  },
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID || '',
    clientSecret: process.env.TWITCH_CLIENT_SECRET || ''
  }
}

// Load settings from file
const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8')
      return { ...defaultSettings, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  return defaultSettings
}

// Save settings to file
const saveSettings = (settings) => {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(SETTINGS_FILE)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    return true
  } catch (error) {
    console.error('Error saving settings:', error)
    return false
  }
}

// Get current settings
router.get('/settings', (req, res) => {
  try {
    const settings = loadSettings()
    
    // Don't send sensitive information to frontend
    const publicSettings = {
      ...settings,
      twitch: {
        clientId: settings.twitch.clientId,
        clientSecret: settings.twitch.clientSecret ? '****' : ''
      }
    }
    
    res.json(publicSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// Update settings
router.post('/settings', (req, res) => {
  try {
    const newSettings = req.body
    const currentSettings = loadSettings()
    
    // Merge with current settings
    const updatedSettings = {
      ...currentSettings,
      ...newSettings
    }
    
    // Validate settings
    const validationErrors = validateSettings(updatedSettings)
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid settings', 
        details: validationErrors 
      })
    }
    
    // Save settings
    const success = saveSettings(updatedSettings)
    
    if (success) {
      res.json({ message: 'Settings updated successfully' })
    } else {
      res.status(500).json({ error: 'Failed to save settings' })
    }
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// Reset settings to default
router.post('/settings/reset', (req, res) => {
  try {
    const success = saveSettings(defaultSettings)
    
    if (success) {
      res.json({ message: 'Settings reset to defaults successfully' })
    } else {
      res.status(500).json({ error: 'Failed to reset settings' })
    }
  } catch (error) {
    console.error('Error resetting settings:', error)
    res.status(500).json({ error: 'Failed to reset settings' })
  }
})

// Validate settings
function validateSettings(settings) {
  const errors = []
  
  // Validate sensitivity settings
  if (settings.sensitivity) {
    const { messageThreshold, emoteThreshold, peakWindowSize, minimumPeakDistance } = settings.sensitivity
    
    if (messageThreshold < 1 || messageThreshold > 1000) {
      errors.push('Message threshold must be between 1 and 1000')
    }
    
    if (emoteThreshold < 1 || emoteThreshold > 100) {
      errors.push('Emote threshold must be between 1 and 100')
    }
    
    if (peakWindowSize < 10 || peakWindowSize > 300) {
      errors.push('Peak window size must be between 10 and 300 seconds')
    }
    
    if (minimumPeakDistance < 30 || minimumPeakDistance > 600) {
      errors.push('Minimum peak distance must be between 30 and 600 seconds')
    }
  }
  
  // Validate clip generation settings
  if (settings.clipGeneration) {
    const { duration, startOffset, format, quality } = settings.clipGeneration
    
    if (duration < 30 || duration > 300) {
      errors.push('Clip duration must be between 30 and 300 seconds')
    }
    
    if (startOffset < 0 || startOffset > 120) {
      errors.push('Start offset must be between 0 and 120 seconds')
    }
    
    if (!['mp4', 'webm', 'avi'].includes(format)) {
      errors.push('Invalid video format')
    }
    
    if (!['low', 'medium', 'high', 'source'].includes(quality)) {
      errors.push('Invalid video quality')
    }
  }
  
  return errors
}

export default router