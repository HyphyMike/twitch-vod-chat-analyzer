import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

export class ClipGenerator {
  constructor() {
    this.clipsDir = path.join(process.cwd(), 'clips')
    this.tempDir = path.join(process.cwd(), 'temp')
    this.ensureDirectories()
    this.activeJobs = new Map()
  }

  ensureDirectories() {
    [this.clipsDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  async generateClips(vodId, vodUrl, peaks) {
    const generatedClips = []
    
    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i]
      const jobId = `${vodId}_${i}_${Date.now()}`
      
      try {
        const clipData = await this.generateSingleClip(vodId, vodUrl, peak, i + 1, jobId)
        generatedClips.push(clipData)
      } catch (error) {
        console.error(`Error generating clip ${i + 1}:`, error)
        // Continue with next clip even if one fails
      }
    }
    
    return generatedClips
  }

  async generateSingleClip(vodId, vodUrl, peak, clipNumber, jobId) {
    const settings = this.loadSettings()
    const duration = settings.clipGeneration?.duration || 60
    const startOffset = settings.clipGeneration?.startOffset || 60
    const format = settings.clipGeneration?.format || 'mp4'
    const quality = settings.clipGeneration?.quality || 'medium'
    
    const startTime = Math.max(0, peak.timestamp - startOffset)
    const endTime = startTime + duration
    
    const filename = `clip_${vodId}_peak${clipNumber}_${Date.now()}.${format}`
    const outputPath = path.join(this.clipsDir, filename)
    
    // Update job status
    this.activeJobs.set(jobId, {
      status: 'processing',
      progress: 0,
      vodId,
      peak,
      filename
    })
    
    try {
      // For demonstration, we'll create a mock clip file
      // In a real implementation, you would use FFmpeg to download and process the actual video
      await this.createMockClip(outputPath, duration, vodId, peak)
      
      // Update job status
      this.activeJobs.set(jobId, {
        status: 'completed',
        progress: 100,
        vodId,
        peak,
        filename
      })
      
      const fileStats = fs.statSync(outputPath)
      
      return {
        id: jobId,
        vodId,
        filename,
        title: `Peak ${clipNumber} - ${peak.peakType} interaction`,
        peakTime: peak.timestamp,
        startTime,
        endTime,
        messageCount: peak.messageCount,
        intensity: peak.intensity,
        fileSize: fileStats.size,
        format,
        videoUrl: `/clips/${filename}`,
        thumbnailUrl: null, // Could generate thumbnail here
        createdAt: new Date().toISOString()
      }
    } catch (error) {
      this.activeJobs.set(jobId, {
        status: 'failed',
        progress: 0,
        error: error.message,
        vodId,
        peak,
        filename
      })
      throw error
    }
  }

  // Create a mock clip file for demonstration
  // In a real implementation, this would use FFmpeg to process actual video
  async createMockClip(outputPath, duration, vodId, peak) {
    return new Promise((resolve, reject) => {
      // Create a simple text file as a placeholder for the actual video
      const clipInfo = {
        vodId,
        peak,
        duration,
        generated: new Date().toISOString(),
        note: 'This is a mock clip file. In a real implementation, this would be a processed video file.'
      }
      
      fs.writeFile(outputPath.replace(path.extname(outputPath), '.json'), 
        JSON.stringify(clipInfo, null, 2), 
        (err) => {
          if (err) reject(err)
          else {
            // Create an empty video file placeholder
            fs.writeFile(outputPath, Buffer.alloc(1024 * 1024), (err) => {
              if (err) reject(err)
              else resolve()
            })
          }
        }
      )
    })
  }

  // Real FFmpeg implementation (commented out for now)
  /*
  async generateClipWithFFmpeg(vodUrl, startTime, duration, outputPath, quality) {
    return new Promise((resolve, reject) => {
      const qualitySettings = {
        low: ['-s', '854x480', '-b:v', '1000k'],
        medium: ['-s', '1280x720', '-b:v', '2500k'],
        high: ['-s', '1920x1080', '-b:v', '5000k'],
        source: []
      }
      
      const args = [
        '-i', vodUrl,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-preset', 'fast',
        ...qualitySettings[quality],
        '-avoid_negative_ts', 'make_zero',
        '-y', // Overwrite output file
        outputPath
      ]
      
      const ffmpeg = spawn('ffmpeg', args)
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`))
        }
      })
      
      ffmpeg.on('error', (error) => {
        reject(error)
      })
    })
  }
  */

  getJobStatus(jobId) {
    return this.activeJobs.get(jobId) || { status: 'not_found' }
  }

  loadSettings() {
    try {
      const settingsPath = path.join(process.cwd(), 'data', 'settings.json')
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
    
    return {
      clipGeneration: {
        duration: 60,
        startOffset: 60,
        format: 'mp4',
        quality: 'medium'
      }
    }
  }

  // Clean up old job statuses
  cleanupJobs() {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      const jobAge = now - parseInt(jobId.split('_').pop())
      if (jobAge > maxAge) {
        this.activeJobs.delete(jobId)
      }
    }
  }
}

export default ClipGenerator