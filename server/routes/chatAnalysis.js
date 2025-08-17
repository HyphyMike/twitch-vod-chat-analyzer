import express from 'express'
import { ChatAnalyzer } from '../services/chatAnalyzer.js'
import { TwitchService } from '../services/twitchService.js'

const router = express.Router()

// Lazy-load services to ensure environment variables are loaded
const getChatAnalyzer = () => new ChatAnalyzer()
const getTwitchService = () => new TwitchService()

// Analyze VOD chat for interaction peaks
router.post('/analyze', async (req, res) => {
  try {
    const { vodId, vodUrl } = req.body
    
    if (!vodId) {
      return res.status(400).json({ error: 'VOD ID is required' })
    }
    
    const twitchService = getTwitchService()
    const chatAnalyzer = getChatAnalyzer()
    
    // Get VOD metadata
    const vodData = await twitchService.getVodById(vodId)
    if (!vodData) {
      return res.status(404).json({ error: 'VOD not found' })
    }
    
    // Get chat logs
    const chatLogs = await twitchService.getVodChatLogs(vodId)
    
    // Analyze chat for interaction peaks
    const analysisResult = await chatAnalyzer.analyzeChatInteraction(chatLogs, vodData)
    
    res.json(analysisResult)
  } catch (error) {
    console.error('Error analyzing chat:', error)
    res.status(500).json({ error: 'Failed to analyze chat data' })
  }
})

// Get analysis for a specific VOD (if previously analyzed)
router.get('/analysis/:vodId', async (req, res) => {
  try {
    const { vodId } = req.params
    const chatAnalyzer = getChatAnalyzer()
    const analysis = await chatAnalyzer.getStoredAnalysis(vodId)
    
    if (!analysis) {
      return res.status(404).json({ error: 'No analysis found for this VOD' })
    }
    
    res.json(analysis)
  } catch (error) {
    console.error('Error retrieving analysis:', error)
    res.status(500).json({ error: 'Failed to retrieve analysis' })
  }
})

// Update analysis settings
router.post('/analysis/settings', async (req, res) => {
  try {
    const settings = req.body
    const chatAnalyzer = getChatAnalyzer()
    await chatAnalyzer.updateSettings(settings)
    
    res.json({ message: 'Analysis settings updated successfully' })
  } catch (error) {
    console.error('Error updating analysis settings:', error)
    res.status(500).json({ error: 'Failed to update analysis settings' })
  }
})

export default router