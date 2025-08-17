import express from 'express'
import { TwitchService } from '../services/twitchService.js'

const router = express.Router()
const twitchService = new TwitchService()

// Get VOD by ID
router.get('/vod/:vodId', async (req, res) => {
  try {
    const { vodId } = req.params
    const vodData = await twitchService.getVodById(vodId)
    
    if (!vodData) {
      return res.status(404).json({ error: 'VOD not found' })
    }
    
    res.json(vodData)
  } catch (error) {
    console.error('Error fetching VOD:', error)
    res.status(500).json({ error: 'Failed to fetch VOD data' })
  }
})

// Search for VODs
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }
    
    const searchResults = await twitchService.searchVods(query)
    res.json(searchResults)
  } catch (error) {
    console.error('Error searching VODs:', error)
    res.status(500).json({ error: 'Failed to search VODs' })
  }
})

// Get VOD metadata and chat logs
router.get('/vod/:vodId/chat', async (req, res) => {
  try {
    const { vodId } = req.params
    const chatData = await twitchService.getVodChatLogs(vodId)
    
    res.json(chatData)
  } catch (error) {
    console.error('Error fetching chat data:', error)
    res.status(500).json({ error: 'Failed to fetch chat data' })
  }
})

export default router