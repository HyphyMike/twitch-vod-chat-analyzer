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
      minimumPeakDistance: 120,
      // New adaptive settings
      sensitivityMode: 'balanced', // conservative, balanced, aggressive
      useAdaptiveThresholds: true,
      multiWindowAnalysis: true,
      contentAnalysis: true,
      windowSizes: [10, 30, 60], // Multiple window sizes in seconds
      excitementKeywords: ['POGGERS', 'KEKW', 'LUL', 'OMEGALUL', 'WOW', 'AMAZING', 'INSANE', 'HOLY', 'POG', 'HYPE', '5Head', 'EZ', 'CLUTCH'],
      disallowedTerms: ['!drop', '!giveaway', 'bot', 'spam', 'scam', 'fake', 'subscribe to me', 'follow me', 'check out my', 'view my channel'],
      percentileThresholds: {
        conservative: { message: 90, intensity: 85 },
        balanced: { message: 75, intensity: 70 },
        aggressive: { message: 60, intensity: 55 }
      }
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings.sensitivity }
  }

  // Calculate stream baseline statistics for adaptive thresholds
  calculateStreamBaseline(messages) {
    const totalMessages = messages.length
    if (totalMessages === 0) return { avgMessages: 0, avgEmotes: 0, activityPercentiles: [] }
    
    // Calculate messages per minute distribution
    const messagesByMinute = {}
    const emotesByMinute = {}
    let maxMinute = 0
    
    messages.forEach(msg => {
      const minute = Math.floor(msg.timestamp / 60)
      maxMinute = Math.max(maxMinute, minute)
      messagesByMinute[minute] = (messagesByMinute[minute] || 0) + 1
      emotesByMinute[minute] = (emotesByMinute[minute] || 0) + (msg.emotes?.length || 0)
    })
    
    // Fill gaps with zero
    const messageCountsPerMinute = []
    const emoteCountsPerMinute = []
    for (let i = 0; i <= maxMinute; i++) {
      messageCountsPerMinute.push(messagesByMinute[i] || 0)
      emoteCountsPerMinute.push(emotesByMinute[i] || 0)
    }
    
    // Calculate percentiles
    const sortedMessageCounts = messageCountsPerMinute.slice().sort((a, b) => a - b)
    const calculatePercentile = (arr, p) => {
      const index = Math.ceil((p / 100) * arr.length) - 1
      return arr[Math.max(0, index)] || 0
    }
    
    return {
      avgMessages: totalMessages / (maxMinute + 1),
      avgEmotes: Object.values(emotesByMinute).reduce((sum, count) => sum + count, 0) / (maxMinute + 1),
      messagePercentiles: {
        p50: calculatePercentile(sortedMessageCounts, 50),
        p75: calculatePercentile(sortedMessageCounts, 75),
        p90: calculatePercentile(sortedMessageCounts, 90),
        p95: calculatePercentile(sortedMessageCounts, 95)
      },
      activityDistribution: messageCountsPerMinute
    }
  }

  // Analyze message content for excitement indicators
  analyzeMessageContent(messages) {
    const { excitementKeywords, disallowedTerms = [] } = this.settings
    let excitementScore = 0
    let disallowedScore = 0
    let capsCount = 0
    let totalChars = 0
    let spamMessages = 0
    const messageCounts = {}
    
    messages.forEach(msg => {
      const content = msg.message || ''
      totalChars += content.length
      
      // Check for excitement keywords
      const upperContent = content.toUpperCase()
      excitementKeywords.forEach(keyword => {
        if (upperContent.includes(keyword)) {
          excitementScore += 1
        }
      })
      
      // Check for disallowed terms (case-insensitive)
      const lowerContent = content.toLowerCase()
      disallowedTerms.forEach(term => {
        if (lowerContent.includes(term.toLowerCase())) {
          disallowedScore += 1
        }
      })
      
      // Calculate caps ratio
      const capsInMessage = content.replace(/[^A-Z]/g, '').length
      capsCount += capsInMessage
      
      // Detect spam (repeated messages)
      const normalizedMessage = content.toLowerCase().replace(/\s+/g, ' ').trim()
      messageCounts[normalizedMessage] = (messageCounts[normalizedMessage] || 0) + 1
      if (messageCounts[normalizedMessage] > 3) {
        spamMessages++
      }
    })
    
    const messageCount = messages.length
    return {
      excitementScore: excitementScore / Math.max(messageCount, 1),
      disallowedScore: disallowedScore / Math.max(messageCount, 1),
      capsRatio: capsCount / Math.max(totalChars, 1),
      spamRatio: spamMessages / Math.max(messageCount, 1),
      avgMessageLength: totalChars / Math.max(messageCount, 1)
    }
  }

  // Create timeline with multiple window sizes and enhanced analysis
  createEnhancedTimeline(messages, duration, baseline) {
    const { windowSizes, multiWindowAnalysis } = this.settings
    const windowSizesToUse = multiWindowAnalysis ? windowSizes : [this.settings.peakWindowSize]
    
    const timelines = {}
    
    windowSizesToUse.forEach(windowSize => {
      const timeline = []
      
      for (let time = 0; time < duration; time += windowSize) {
        const windowMessages = messages.filter(msg => 
          msg.timestamp >= time && msg.timestamp < time + windowSize
        )
        
        const messageCount = windowMessages.length
        const emoteCount = windowMessages.reduce((sum, msg) => sum + (msg.emotes?.length || 0), 0)
        const uniqueUsers = new Set(windowMessages.map(msg => msg.user)).size
        const subscriberMessages = windowMessages.filter(msg => msg.isSubscriber).length
        
        // Content analysis for this window
        const contentAnalysis = this.settings.contentAnalysis ? 
          this.analyzeMessageContent(windowMessages) : 
          { excitementScore: 0, disallowedScore: 0, capsRatio: 0, spamRatio: 0, avgMessageLength: 0 }
        
        timeline.push({
          timestamp: time,
          messageCount,
          emoteCount,
          uniqueUsers,
          subscriberMessages,
          messagesPerSecond: messageCount / windowSize,
          contentAnalysis,
          windowSize
        })
      }
      
      timelines[windowSize] = timeline
    })
    
    // Return combined timeline for backward compatibility, or multiple if requested
    return multiWindowAnalysis ? timelines : timelines[this.settings.peakWindowSize]
  }

  // Main analysis function
  async analyzeChatInteraction(chatLogs, vodData) {
    try {
      const { messages, duration } = chatLogs
      
      // Calculate stream baseline for adaptive thresholds
      const baseline = this.calculateStreamBaseline(messages)
      
      // Create enhanced timeline with multiple window sizes if enabled
      const timelineData = this.createEnhancedTimeline(messages, duration, baseline)
      
      // For backward compatibility, use the primary window size timeline for peak detection
      const primaryTimeline = this.settings.multiWindowAnalysis ? 
        timelineData[this.settings.peakWindowSize] : timelineData
      
      // Detect interaction peaks with enhanced algorithm
      const peaks = this.detectEnhancedPeaks(primaryTimeline, baseline, timelineData)
      
      // Calculate enhanced statistics
      const stats = this.calculateEnhancedStats(messages, baseline)
      
      const analysisResult = {
        vodId: chatLogs.vodId,
        vodTitle: vodData.title,
        timeline: primaryTimeline, // Keep backward compatibility
        multiWindowTimelines: this.settings.multiWindowAnalysis ? timelineData : undefined,
        peaks,
        stats,
        baseline,
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

  // Enhanced peak detection with adaptive thresholds and multiple algorithms
  detectEnhancedPeaks(timeline, baseline, multiWindowTimelines = null) {
    const peaks = []
    const { 
      messageThreshold, 
      emoteThreshold, 
      minimumPeakDistance, 
      useAdaptiveThresholds,
      sensitivityMode,
      percentileThresholds
    } = this.settings
    
    // Calculate adaptive thresholds if enabled
    let adaptiveMessageThreshold = messageThreshold
    let adaptiveIntensityThreshold = 1.5
    
    if (useAdaptiveThresholds && baseline.messagePercentiles) {
      const thresholds = percentileThresholds[sensitivityMode] || percentileThresholds.balanced
      adaptiveMessageThreshold = Math.max(
        baseline.messagePercentiles[`p${thresholds.message}`] || messageThreshold,
        messageThreshold * 0.5 // Don't go below 50% of original threshold
      )
      adaptiveIntensityThreshold = thresholds.intensity / 100 * 3 // Scale to intensity range
    }
    
    // Calculate enhanced moving averages
    const movingAverage = this.calculateMovingAverage(timeline.map(point => point.messageCount), 3)
    const contentScores = timeline.map(point => this.calculateContentScore(point))
    
    // Multi-window analysis if available
    let multiWindowPeaks = []
    if (multiWindowTimelines && this.settings.multiWindowAnalysis) {
      multiWindowPeaks = this.findMultiWindowPeaks(multiWindowTimelines, baseline)
    }
    
    for (let i = 1; i < timeline.length - 1; i++) {
      const current = timeline[i]
      const prev = timeline[i - 1]
      const next = timeline[i + 1]
      
      // Check if this is a local maximum
      const isLocalMax = current.messageCount > prev.messageCount && current.messageCount > next.messageCount
      
      // Check adaptive thresholds
      const meetsMessageThreshold = current.messageCount >= adaptiveMessageThreshold
      const meetsEmoteThreshold = current.emoteCount >= emoteThreshold
      
      // Calculate enhanced intensity score
      const intensity = this.calculateEnhancedIntensity(current, movingAverage[i], baseline, contentScores[i])
      
      // Enhanced peak criteria
      const isSignificantPeak = intensity > adaptiveIntensityThreshold
      const hasContentExcitement = contentScores[i] > 0.1 // Minimum content excitement
      const isNotSpam = !current.contentAnalysis || current.contentAnalysis.spamRatio < 0.5
      
      // Consider multi-window validation
      let multiWindowSupport = false
      if (multiWindowPeaks.length > 0) {
        multiWindowSupport = multiWindowPeaks.some(mp => 
          Math.abs(mp.timestamp - current.timestamp) < this.settings.peakWindowSize
        )
      }
      
      // Relaxed criteria for content analysis enabled
      const passesEnhancedCriteria = this.settings.contentAnalysis ? 
        (isLocalMax && meetsMessageThreshold && isSignificantPeak && hasContentExcitement && isNotSpam) ||
        (multiWindowSupport && isSignificantPeak) :
        (isLocalMax && meetsMessageThreshold && isSignificantPeak)
      
      if (passesEnhancedCriteria) {
        // Check minimum distance from previous peaks
        const lastPeak = peaks[peaks.length - 1]
        const minDistance = this.calculateMinimumDistance(current, baseline)
        
        if (!lastPeak || current.timestamp - lastPeak.timestamp >= minDistance) {
          peaks.push({
            timestamp: current.timestamp,
            messageCount: current.messageCount,
            emoteCount: current.emoteCount,
            uniqueUsers: current.uniqueUsers,
            subscriberMessages: current.subscriberMessages,
            intensity: intensity,
            contentScore: contentScores[i],
            peakType: this.classifyEnhancedPeak(current, intensity, contentScores[i]),
            multiWindowSupport,
            adaptiveThresholds: { message: adaptiveMessageThreshold, intensity: adaptiveIntensityThreshold }
          })
        }
      }
    }
    
    // Sort peaks by enhanced scoring
    peaks.sort((a, b) => (b.intensity + b.contentScore) - (a.intensity + a.contentScore))
    
    return peaks
  }

  // Find peaks across multiple window sizes
  findMultiWindowPeaks(multiWindowTimelines, baseline) {
    const allPeaks = []
    
    Object.entries(multiWindowTimelines).forEach(([windowSize, timeline]) => {
      const windowPeaks = this.detectPeaks(timeline) // Use original method for each window
      windowPeaks.forEach(peak => {
        allPeaks.push({
          ...peak,
          windowSize: parseInt(windowSize),
          normalizedIntensity: peak.intensity / Math.max(baseline.avgMessages, 1)
        })
      })
    })
    
    // Merge overlapping peaks from different window sizes
    const mergedPeaks = this.mergeOverlappingPeaks(allPeaks)
    return mergedPeaks
  }

  // Merge peaks that are close in time from different window sizes
  mergeOverlappingPeaks(peaks) {
    if (peaks.length === 0) return []
    
    // Sort by timestamp
    peaks.sort((a, b) => a.timestamp - b.timestamp)
    
    const merged = []
    let currentGroup = [peaks[0]]
    
    for (let i = 1; i < peaks.length; i++) {
      const current = peaks[i]
      const lastInGroup = currentGroup[currentGroup.length - 1]
      
      // If peaks are within 60 seconds of each other, group them
      if (current.timestamp - lastInGroup.timestamp <= 60) {
        currentGroup.push(current)
      } else {
        // Process current group and start new one
        merged.push(this.consolidateGroup(currentGroup))
        currentGroup = [current]
      }
    }
    
    // Process final group
    if (currentGroup.length > 0) {
      merged.push(this.consolidateGroup(currentGroup))
    }
    
    return merged
  }

  // Consolidate a group of overlapping peaks
  consolidateGroup(group) {
    if (group.length === 1) return group[0]
    
    // Find the peak with highest normalized intensity
    const bestPeak = group.reduce((best, current) => 
      current.normalizedIntensity > best.normalizedIntensity ? current : best
    )
    
    return {
      ...bestPeak,
      multiWindowConfidence: group.length / 3, // Confidence based on how many windows detected it
      supportingWindows: group.map(p => p.windowSize)
    }
  }

  // Calculate content-based excitement score
  calculateContentScore(point) {
    if (!point.contentAnalysis) return 0
    
    const { excitementScore, disallowedScore = 0, capsRatio, spamRatio } = point.contentAnalysis
    
    // Weight different factors
    const excitementWeight = excitementScore * 2 // High weight for excitement keywords
    const disallowedPenalty = disallowedScore * -2 // Penalty for disallowed terms
    const capsWeight = Math.min(capsRatio * 3, 1) // Caps indicate excitement but cap at 1
    const spamPenalty = spamRatio * -1 // Penalty for spam
    
    return Math.max(0, excitementWeight + disallowedPenalty + capsWeight + spamPenalty)
  }

  // Calculate dynamic minimum distance between peaks
  calculateMinimumDistance(point, baseline) {
    const baseDistance = this.settings.minimumPeakDistance
    
    // Shorter distance for high-activity streams
    if (baseline.avgMessages > 100) {
      return Math.max(baseDistance * 0.7, 60) // Min 1 minute
    }
    
    // Longer distance for low-activity streams  
    if (baseline.avgMessages < 20) {
      return Math.min(baseDistance * 1.5, 300) // Max 5 minutes
    }
    
    return baseDistance
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

  // Enhanced intensity calculation with content analysis and baseline normalization
  calculateEnhancedIntensity(point, movingAverage, baseline, contentScore = 0) {
    // Original intensity factors
    const messageIntensity = point.messageCount / Math.max(movingAverage, 1)
    const emoteMultiplier = 1 + (point.emoteCount / Math.max(point.messageCount, 1))
    const userDiversityMultiplier = 1 + (point.uniqueUsers / Math.max(point.messageCount, 1))
    const subscriberMultiplier = 1 + (point.subscriberMessages / Math.max(point.messageCount, 1))
    
    // Enhanced factors
    const baselineNormalization = Math.max(baseline.avgMessages, 1)
    const normalizedMessageIntensity = (point.messageCount / baselineNormalization) * messageIntensity
    
    // Content-based multipliers
    const contentMultiplier = 1 + contentScore
    const velocityMultiplier = 1 + Math.min(point.messagesPerSecond / 2, 1) // Cap velocity impact
    
    // Chat readability factor (penalize too fast chat)
    const readabilityFactor = point.messagesPerSecond > 10 ? 0.8 : 1 // Reduce score for unreadable chat
    
    return normalizedMessageIntensity * emoteMultiplier * userDiversityMultiplier * 
           subscriberMultiplier * contentMultiplier * velocityMultiplier * readabilityFactor
  }

  // Enhanced peak classification with content awareness
  classifyEnhancedPeak(point, intensity, contentScore) {
    const totalScore = intensity + contentScore
    
    if (totalScore > 8) return 'epic'
    if (totalScore > 6) return 'massive'
    if (totalScore > 4) return 'major'
    if (totalScore > 2) return 'moderate'
    return 'minor'
  }

  // Enhanced statistics calculation with content analysis
  calculateEnhancedStats(messages, baseline) {
    const basicStats = this.calculateStats(messages)
    
    // Enhanced content analysis
    const overallContentAnalysis = this.analyzeMessageContent(messages)
    
    // Activity pattern analysis
    const activityPatterns = this.analyzeActivityPatterns(messages)
    
    // Chat velocity analysis
    const velocityAnalysis = this.analyzeChatVelocity(messages)
    
    return {
      ...basicStats,
      baseline,
      contentAnalysis: overallContentAnalysis,
      activityPatterns,
      velocityAnalysis,
      enhancedMetrics: {
        chatReadabilityScore: this.calculateReadabilityScore(velocityAnalysis),
        excitementLevel: this.calculateOverallExcitement(overallContentAnalysis),
        engagementQuality: this.calculateEngagementQuality(basicStats, overallContentAnalysis)
      }
    }
  }

  // Analyze chat activity patterns
  analyzeActivityPatterns(messages) {
    const hourlyActivity = {}
    const userActivity = {}
    
    messages.forEach(msg => {
      const hour = Math.floor(msg.timestamp / 3600)
      const user = msg.user
      
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
      userActivity[user] = (userActivity[user] || 0) + 1
    })
    
    const userCounts = Object.values(userActivity)
    const avgMessagesPerUser = userCounts.reduce((sum, count) => sum + count, 0) / userCounts.length
    
    return {
      hourlyDistribution: hourlyActivity,
      avgMessagesPerUser,
      activeChatters: userCounts.filter(count => count > 5).length,
      lurkerRatio: userCounts.filter(count => count === 1).length / userCounts.length
    }
  }

  // Analyze chat velocity and readability
  analyzeChatVelocity(messages) {
    const velocityByMinute = {}
    
    messages.forEach(msg => {
      const minute = Math.floor(msg.timestamp / 60)
      velocityByMinute[minute] = (velocityByMinute[minute] || 0) + 1
    })
    
    const velocities = Object.values(velocityByMinute)
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length
    const maxVelocity = Math.max(...velocities)
    
    return {
      averageVelocity: avgVelocity,
      peakVelocity: maxVelocity,
      velocityVariance: this.calculateVariance(velocities),
      fastChatPeriods: velocities.filter(v => v > avgVelocity * 2).length
    }
  }

  // Calculate readability score based on chat velocity
  calculateReadabilityScore(velocityAnalysis) {
    const { averageVelocity, peakVelocity } = velocityAnalysis
    
    // Optimal reading speed is around 3-10 messages per minute
    if (averageVelocity <= 10) return 1.0 // Highly readable
    if (averageVelocity <= 30) return 0.8 // Readable
    if (averageVelocity <= 60) return 0.6 // Moderately readable
    if (averageVelocity <= 120) return 0.4 // Hard to read
    return 0.2 // Unreadable
  }

  // Calculate overall excitement level
  calculateOverallExcitement(contentAnalysis) {
    const { excitementScore, disallowedScore = 0, capsRatio, spamRatio } = contentAnalysis
    
    const baseExcitement = excitementScore * 10 // Scale up
    const disallowedPenalty = disallowedScore * -8 // Strong penalty for disallowed terms
    const capsBonus = Math.min(capsRatio * 5, 2) // Cap bonus
    const spamPenalty = spamRatio * -3
    
    return Math.max(0, Math.min(10, baseExcitement + disallowedPenalty + capsBonus + spamPenalty))
  }

  // Calculate engagement quality score
  calculateEngagementQuality(basicStats, contentAnalysis) {
    const diversityScore = basicStats.uniqueUsers / Math.max(basicStats.totalMessages, 1)
    const emoteScore = Math.min(basicStats.emoteRatio * 5, 2)
    const excitementScore = contentAnalysis.excitementScore * 3
    const disallowedPenalty = (contentAnalysis.disallowedScore || 0) * -3 // Penalty for disallowed terms
    const spamPenalty = contentAnalysis.spamRatio * -2
    
    return Math.max(0, Math.min(10, (diversityScore * 10 + emoteScore + excitementScore + disallowedPenalty + spamPenalty) / 2))
  }

  // Helper method to calculate variance
  calculateVariance(values) {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
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