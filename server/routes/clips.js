import express from 'express'
import fs from 'fs'
import path from 'path'
import { ClipGenerator } from '../services/clipGenerator.js'
import { DatabaseService } from '../services/database.js'

const router = express.Router()
const clipGenerator = new ClipGenerator()
const database = new DatabaseService()

// Generate clips from analysis peaks
router.post('/generate-clips', async (req, res) => {
  try {
    const { vodId, vodUrl, peaks } = req.body
    
    if (!vodId || !peaks || !Array.isArray(peaks)) {
      return res.status(400).json({ error: 'VOD ID and peaks array are required' })
    }
    
    if (peaks.length === 0) {
      return res.status(400).json({ error: 'No peaks provided for clip generation' })
    }
    
    // Generate clips for each peak
    const generatedClips = await clipGenerator.generateClips(vodId, vodUrl, peaks)
    
    // Store clip metadata in database
    for (const clip of generatedClips) {
      await database.saveClip(clip)
    }
    
    res.json({
      message: 'Clips generated successfully',
      clipsGenerated: generatedClips.length,
      clips: generatedClips
    })
  } catch (error) {
    console.error('Error generating clips:', error)
    res.status(500).json({ error: 'Failed to generate clips' })
  }
})

// Get all generated clips
router.get('/clips', async (req, res) => {
  try {
    const clips = await database.getAllClips()
    res.json(clips)
  } catch (error) {
    console.error('Error fetching clips:', error)
    res.status(500).json({ error: 'Failed to fetch clips' })
  }
})

// Get specific clip by ID
router.get('/clips/:clipId', async (req, res) => {
  try {
    const { clipId } = req.params
    const clip = await database.getClipById(clipId)
    
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' })
    }
    
    res.json(clip)
  } catch (error) {
    console.error('Error fetching clip:', error)
    res.status(500).json({ error: 'Failed to fetch clip' })
  }
})

// Download clip file
router.get('/clips/:clipId/download', async (req, res) => {
  try {
    const { clipId } = req.params
    const clip = await database.getClipById(clipId)
    
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' })
    }
    
    const filePath = path.join(process.cwd(), 'clips', clip.filename)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Clip file not found' })
    }
    
    res.download(filePath, clip.filename)
  } catch (error) {
    console.error('Error downloading clip:', error)
    res.status(500).json({ error: 'Failed to download clip' })
  }
})

// Delete clip
router.delete('/clips/:clipId', async (req, res) => {
  try {
    const { clipId } = req.params
    const clip = await database.getClipById(clipId)
    
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' })
    }
    
    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'clips', clip.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    
    // Delete from database
    await database.deleteClip(clipId)
    
    res.json({ message: 'Clip deleted successfully' })
  } catch (error) {
    console.error('Error deleting clip:', error)
    res.status(500).json({ error: 'Failed to delete clip' })
  }
})

// Get clip generation status
router.get('/clips/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const status = await clipGenerator.getJobStatus(jobId)
    
    res.json(status)
  } catch (error) {
    console.error('Error fetching clip generation status:', error)
    res.status(500).json({ error: 'Failed to fetch status' })
  }
})

export default router