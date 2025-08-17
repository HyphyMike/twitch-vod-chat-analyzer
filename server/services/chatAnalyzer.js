import fs from 'fs'
import path from 'path'
import { DatabaseService } from './database.js'

export class ChatAnalyzer {
  constructor() {
    this.database = new DatabaseService()
    this.settings = this.loadSettings()
  }

  loadSettings() {
    try {
      const settingsPath = path.join(process.cwd(), 'data', 'settings.json')
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf8')
        const settings = JSON.parse(data)
        return settings.sensitivity || this.getDefaultSettings()
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
    return this.getDefaultSettings()
  }

  getDefaultSettings() {
    return {
      messageThreshold: 50,
      emoteThreshold: 10,
      peakWindowSize: 30,
      minimumPeakDistance: 120
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings.sensitivity }
  }

  // Main analysis function
  async analyzeChatInteraction(chatLogs, vodData) {
    try {
      const { messages, duration } = chatLogs
      
      // Create timeline with aggregated data
      const timeline = this.createTimeline(messages, duration)
      
      // Detect interaction peaks
      const peaks = this.detectPeaks(timeline)
      
      // Calculate statistics
      const stats = this.calculateStats(messages)
      
      const analysisResult = {
        vodId: chatLogs.vodId,
        vodTitle: vodData.title,
        timeline,
        peaks,
        stats,
        analyzedAt: new Date().toISOString(),
        settings: this.settings
      }
      
      // Store analysis result
      await this.storeAnalysis(analysisResult)
      
      return analysisResult
    } catch (error) {
      console.error('Error analyzing chat interaction:', error)
      throw new Error('Failed to analyze chat interaction')
    }
  }

  // Create timeline with message counts per time window
  createTimeline(messages, duration) {
    const windowSize = this.settings.peakWindowSize
    const timeline = []
    
    for (let time = 0; time < duration; time += windowSize) {
      const windowMessages = messages.filter(msg => 
        msg.timestamp >= time && msg.timestamp < time + windowSize
      )
      
      const messageCount = windowMessages.length
      const emoteCount = windowMessages.reduce((sum, msg) => sum + msg.emotes.length, 0)
      const uniqueUsers = new Set(windowMessages.map(msg => msg.user)).size
      const subscriberMessages = windowMessages.filter(msg => msg.isSubscriber).length
      
      timeline.push({
        timestamp: time,
        messageCount,
        emoteCount,
        uniqueUsers,
        subscriberMessages,
        messagesPerSecond: messageCount / windowSize
      })
    }
    
    return timeline
  }

  // Detect interaction peaks based on message frequency and emote usage
  detectPeaks(timeline) {
    const peaks = []
    const { messageThreshold, emoteThreshold, minimumPeakDistance } = this.settings
    
    // Calculate moving averages for better peak detection
    const movingAverage = this.calculateMovingAverage(timeline.map(point => point.messageCount), 3)
    
    for (let i = 1; i < timeline.length - 1; i++) {
      const current = timeline[i]
      const prev = timeline[i - 1]
      const next = timeline[i + 1]
      
      // Check if this is a local maximum
      const isLocalMax = current.messageCount > prev.messageCount && current.messageCount > next.messageCount
      
      // Check if it meets our thresholds
      const meetsMessageThreshold = current.messageCount >= messageThreshold
      const meetsEmoteThreshold = current.emoteCount >= emoteThreshold
      
      // Calculate intensity score
      const intensity = this.calculateIntensity(current, movingAverage[i])
      
      if (isLocalMax && meetsMessageThreshold && intensity > 1.5) {
        // Check minimum distance from previous peaks
        const lastPeak = peaks[peaks.length - 1]
        if (!lastPeak || current.timestamp - lastPeak.timestamp >= minimumPeakDistance) {
          peaks.push({
            timestamp: current.timestamp,
            messageCount: current.messageCount,
            emoteCount: current.emoteCount,
            uniqueUsers: current.uniqueUsers,
            subscriberMessages: current.subscriberMessages,
            intensity: intensity,
            peakType: this.classifyPeak(current, intensity)
          })
        }
      }
    }
    
    // Sort peaks by intensity (highest first)
    peaks.sort((a, b) => b.intensity - a.intensity)
    
    return peaks
  }

  // Calculate moving average
  calculateMovingAverage(data, windowSize) {
    const result = []
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2))
      const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1)
      const window = data.slice(start, end)
      const average = window.reduce((sum, val) => sum + val, 0) / window.length
      result.push(average)
    }
    return result
  }

  // Calculate intensity score
  calculateIntensity(point, baseline) {
    const messageIntensity = point.messageCount / Math.max(baseline, 1)
    const emoteMultiplier = 1 + (point.emoteCount / Math.max(point.messageCount, 1))
    const userDiversityMultiplier = 1 + (point.uniqueUsers / Math.max(point.messageCount, 1))
    const subscriberMultiplier = 1 + (point.subscriberMessages / Math.max(point.messageCount, 1))
    
    return messageIntensity * emoteMultiplier * userDiversityMultiplier * subscriberMultiplier
  }

  // Classify peak type based on characteristics
  classifyPeak(point, intensity) {
    if (intensity > 5) return 'massive'
    if (intensity > 3) return 'major'
    if (intensity > 2) return 'moderate'
    return 'minor'
  }

  // Calculate overall statistics
  calculateStats(messages) {
    const totalMessages = messages.length
    const uniqueUsers = new Set(messages.map(msg => msg.user)).size
    const totalEmotes = messages.reduce((sum, msg) => sum + msg.emotes.length, 0)
    const subscriberMessages = messages.filter(msg => msg.isSubscriber).length
    const moderatorMessages = messages.filter(msg => msg.isModerator).length
    
    // Calculate emote frequency
    const emoteFrequency = {}
    messages.forEach(msg => {
      msg.emotes.forEach(emote => {
        emoteFrequency[emote] = (emoteFrequency[emote] || 0) + 1
      })
    })
    
    // Get top emotes
    const topEmotes = Object.entries(emoteFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([emote, count]) => ({ emote, count }))
    
    // Calculate chat activity distribution
    const messagesByMinute = {}
    messages.forEach(msg => {
      const minute = Math.floor(msg.timestamp / 60)
      messagesByMinute[minute] = (messagesByMinute[minute] || 0) + 1
    })
    
    const avgMessagesPerMinute = totalMessages / (Math.max(...Object.keys(messagesByMinute).map(Number)) + 1)
    
    return {
      totalMessages,
      uniqueUsers,
      totalEmotes,
      subscriberMessages,
      moderatorMessages,
      subscriberRatio: subscriberMessages / totalMessages,
      emoteRatio: totalEmotes / totalMessages,
      avgMessagesPerMinute,
      topEmotes,
      chatActivityDistribution: messagesByMinute
    }
  }

  // Store analysis result
  async storeAnalysis(analysisResult) {
    try {
      await this.database.saveAnalysis(analysisResult)
    } catch (error) {
      console.error('Error storing analysis:', error)
    }
  }

  // Get stored analysis
  async getStoredAnalysis(vodId) {
    try {
      return await this.database.getAnalysis(vodId)
    } catch (error) {
      console.error('Error retrieving stored analysis:', error)
      return null
    }
  }
}

export default ChatAnalyzer