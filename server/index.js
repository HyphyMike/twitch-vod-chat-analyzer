// Initialize environment variables FIRST before any other imports
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory for .env file path
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure dotenv with explicit path
dotenv.config({ path: path.join(__dirname, '../.env') })

import express from 'express'
import cors from 'cors'
import fs from 'fs'

// Import route handlers
import vodRoutes from './routes/vod.js'
import chatAnalysisRoutes from './routes/chatAnalysis.js'
import clipRoutes from './routes/clips.js'
import settingsRoutes from './routes/settings.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Create necessary directories
const ensureDirectories = () => {
  const dirs = ['./data', './clips', './temp']
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

ensureDirectories()

// Serve static files
app.use('/clips', express.static(path.join(__dirname, '../clips')))

// API Routes
app.use('/api', vodRoutes)
app.use('/api', chatAnalysisRoutes)
app.use('/api', clipRoutes)
app.use('/api', settingsRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 API available at: http://localhost:${PORT}/api`)
  
  // Debug environment variable loading
  console.log('🔧 Environment variables loaded:')
  console.log(`   TWITCH_CLIENT_ID: ${process.env.TWITCH_CLIENT_ID ? `${process.env.TWITCH_CLIENT_ID.substring(0, 8)}...` : 'undefined'}`)
  console.log(`   TWITCH_CLIENT_SECRET: ${process.env.TWITCH_CLIENT_SECRET ? `${process.env.TWITCH_CLIENT_SECRET.substring(0, 8)}...` : 'undefined'}`)
  console.log(`   DATABASE_PATH: ${process.env.DATABASE_PATH || 'undefined'}`)
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌐 Frontend dev server: http://localhost:3000`)
  }
})

export default app