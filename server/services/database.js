import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

export class DatabaseService {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'analyzer.db')
    this.db = null
    this.initDatabase()
  }

  async initDatabase() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      this.db = new sqlite3.Database(this.dbPath)
      await this.createTables()
    } catch (error) {
      console.error('Error initializing database:', error)
    }
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Analysis table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vod_id TEXT UNIQUE NOT NULL,
            vod_title TEXT,
            timeline TEXT,
            peaks TEXT,
            stats TEXT,
            settings TEXT,
            analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)

        // Clips table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS clips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vod_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            title TEXT,
            peak_time INTEGER,
            start_time INTEGER,
            end_time INTEGER,
            message_count INTEGER,
            intensity REAL,
            file_size INTEGER,
            format TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    })
  }

  // Analysis methods
  async saveAnalysis(analysisData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO analysis 
        (vod_id, vod_title, timeline, peaks, stats, settings, analyzed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      
      const values = [
        analysisData.vodId,
        analysisData.vodTitle,
        JSON.stringify(analysisData.timeline),
        JSON.stringify(analysisData.peaks),
        JSON.stringify(analysisData.stats),
        JSON.stringify(analysisData.settings),
        analysisData.analyzedAt
      ]

      this.db.run(query, values, function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
    })
  }

  async getAnalysis(vodId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM analysis WHERE vod_id = ?'
      
      this.db.get(query, [vodId], (err, row) => {
        if (err) {
          reject(err)
        } else if (row) {
          resolve({
            id: row.id,
            vodId: row.vod_id,
            vodTitle: row.vod_title,
            timeline: JSON.parse(row.timeline),
            peaks: JSON.parse(row.peaks),
            stats: JSON.parse(row.stats),
            settings: JSON.parse(row.settings),
            analyzedAt: row.analyzed_at
          })
        } else {
          resolve(null)
        }
      })
    })
  }

  async getAllAnalyses() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM analysis ORDER BY analyzed_at DESC'
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err)
        } else {
          const analyses = rows.map(row => ({
            id: row.id,
            vodId: row.vod_id,
            vodTitle: row.vod_title,
            timeline: JSON.parse(row.timeline),
            peaks: JSON.parse(row.peaks),
            stats: JSON.parse(row.stats),
            settings: JSON.parse(row.settings),
            analyzedAt: row.analyzed_at
          }))
          resolve(analyses)
        }
      })
    })
  }

  // Clip methods
  async saveClip(clipData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO clips 
        (vod_id, filename, title, peak_time, start_time, end_time, message_count, intensity, file_size, format)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const values = [
        clipData.vodId,
        clipData.filename,
        clipData.title || `Clip at ${Math.floor(clipData.peakTime / 60)}:${(clipData.peakTime % 60).toString().padStart(2, '0')}`,
        clipData.peakTime,
        clipData.startTime,
        clipData.endTime,
        clipData.messageCount,
        clipData.intensity,
        clipData.fileSize || 0,
        clipData.format || 'mp4'
      ]

      this.db.run(query, values, function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
    })
  }

  async getClipById(clipId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM clips WHERE id = ?'
      
      this.db.get(query, [clipId], (err, row) => {
        if (err) {
          reject(err)
        } else if (row) {
          resolve({
            id: row.id,
            vodId: row.vod_id,
            filename: row.filename,
            title: row.title,
            peakTime: row.peak_time,
            startTime: row.start_time,
            endTime: row.end_time,
            messageCount: row.message_count,
            intensity: row.intensity,
            fileSize: row.file_size,
            format: row.format,
            createdAt: row.created_at
          })
        } else {
          resolve(null)
        }
      })
    })
  }

  async getAllClips() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM clips ORDER BY created_at DESC'
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err)
        } else {
          const clips = rows.map(row => ({
            id: row.id,
            vodId: row.vod_id,
            filename: row.filename,
            title: row.title,
            peakTime: row.peak_time,
            startTime: row.start_time,
            endTime: row.end_time,
            messageCount: row.message_count,
            intensity: row.intensity,
            fileSize: row.file_size,
            format: row.format,
            createdAt: row.created_at
          }))
          resolve(clips)
        }
      })
    })
  }

  async deleteClip(clipId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM clips WHERE id = ?'
      
      this.db.run(query, [clipId], function(err) {
        if (err) reject(err)
        else resolve(this.changes)
      })
    })
  }

  async getClipsByVodId(vodId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM clips WHERE vod_id = ? ORDER BY peak_time ASC'
      
      this.db.all(query, [vodId], (err, rows) => {
        if (err) {
          reject(err)
        } else {
          const clips = rows.map(row => ({
            id: row.id,
            vodId: row.vod_id,
            filename: row.filename,
            title: row.title,
            peakTime: row.peak_time,
            startTime: row.start_time,
            endTime: row.end_time,
            messageCount: row.message_count,
            intensity: row.intensity,
            fileSize: row.file_size,
            format: row.format,
            createdAt: row.created_at
          }))
          resolve(clips)
        }
      })
    })
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close()
    }
  }
}

export default DatabaseService