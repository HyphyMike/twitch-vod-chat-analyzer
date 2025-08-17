import axios from 'axios'
import fs from 'fs'
import path from 'path'

export class TwitchService {
  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET
    this.accessToken = null
    this.tokenExpiry = null
  }

  // Get OAuth access token
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken
    }

    try {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials'
      })

      this.accessToken = response.data.access_token
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000)
      
      return this.accessToken
    } catch (error) {
      console.error('Error getting Twitch access token:', error)
      throw new Error('Failed to authenticate with Twitch API')
    }
  }

  // Make authenticated API request
  async makeApiRequest(url, params = {}) {
    const token = await this.getAccessToken()
    
    const response = await axios.get(url, {
      headers: {
        'Client-ID': this.clientId,
        'Authorization': `Bearer ${token}`
      },
      params
    })

    return response.data
  }

  // Get VOD by ID
  async getVodById(vodId) {
    try {
      const data = await this.makeApiRequest('https://api.twitch.tv/helix/videos', {
        id: vodId
      })

      if (data.data && data.data.length > 0) {
        return data.data[0]
      }
      
      return null
    } catch (error) {
      console.error('Error fetching VOD:', error)
      throw new Error('Failed to fetch VOD data')
    }
  }

  // Search for VODs
  async searchVods(query) {
    try {
      // If query contains a username, search by user
      if (!query.includes('twitch.tv/videos/')) {
        // First, try to find the user
        const userData = await this.makeApiRequest('https://api.twitch.tv/helix/users', {
          login: query.toLowerCase()
        })

        if (userData.data && userData.data.length > 0) {
          const userId = userData.data[0].id
          
          // Get VODs for this user
          const vodData = await this.makeApiRequest('https://api.twitch.tv/helix/videos', {
            user_id: userId,
            type: 'archive',
            first: 20
          })

          return {
            data: vodData.data || [],
            pagination: vodData.pagination
          }
        }
      }

      // Fallback: return empty results for now
      // In a real implementation, you might want to search across all VODs
      return { data: [], pagination: {} }
    } catch (error) {
      console.error('Error searching VODs:', error)
      throw new Error('Failed to search VODs')
    }
  }

  // Get chat logs for a VOD (mock implementation)
  async getVodChatLogs(vodId) {
    try {
      // In a real implementation, you would use a service like:
      // - Twitch API (requires special access)
      // - Third-party chat replay services
      // - Pre-downloaded chat logs
      
      // For now, we'll generate mock chat data for demonstration
      return this.generateMockChatData(vodId)
    } catch (error) {
      console.error('Error fetching chat logs:', error)
      throw new Error('Failed to fetch chat logs')
    }
  }

  // Generate mock chat data for demonstration
  generateMockChatData(vodId) {
    const messages = []
    const emotes = ['PogChamp', 'LUL', 'Kappa', 'EZ', 'Clap', '5Head', 'OMEGALUL', 'Kreygasm', 'MonkaS', 'FeelsGoodMan']
    const users = ['viewer1', 'chatuser', 'pogger123', 'streamer_fan', 'emote_spam', 'casual_viewer', 'sub_user', 'mod_user']
    
    // Generate 2 hours worth of chat (7200 seconds)
    const duration = 7200
    const baseMessageRate = 20 // base messages per minute
    
    for (let time = 0; time < duration; time += 30) { // 30 second intervals
      const variance = Math.random() * 0.5 + 0.75 // 0.75 to 1.25 multiplier
      let messageCount = Math.floor(baseMessageRate * variance)
      
      // Create some artificial peaks
      if (time > 1800 && time < 1900) messageCount *= 3 // Peak around 30 minutes
      if (time > 3600 && time < 3720) messageCount *= 4 // Big peak around 1 hour
      if (time > 5400 && time < 5520) messageCount *= 2.5 // Peak around 1.5 hours
      if (time > 6300 && time < 6420) messageCount *= 5 // Huge peak near end
      
      for (let i = 0; i < messageCount; i++) {
        const user = users[Math.floor(Math.random() * users.length)]
        const timestamp = time + Math.random() * 30
        
        let message = ''
        const messageType = Math.random()
        
        if (messageType < 0.3) {
          // Emote message
          const emoteCount = Math.floor(Math.random() * 3) + 1
          message = Array(emoteCount).fill().map(() => 
            emotes[Math.floor(Math.random() * emotes.length)]
          ).join(' ')
        } else if (messageType < 0.5) {
          // Short reaction
          const reactions = ['YES!', 'NO WAY', 'WHAT', 'INSANE', 'OMG', 'NICE', 'NOOO', 'HYPE', 'LOL', 'WOW']
          message = reactions[Math.floor(Math.random() * reactions.length)]
        } else {
          // Regular message
          const messages_pool = [
            'that was sick!',
            'how did he do that?',
            'this streamer is so good',
            'first time watching, loving it',
            'when is the next stream?',
            'can you play that game again?',
            'your setup is amazing',
            'subbed!',
            'gg',
            'wp'
          ]
          message = messages_pool[Math.floor(Math.random() * messages_pool.length)]
        }
        
        messages.push({
          id: `msg_${timestamp}_${i}`,
          timestamp: Math.floor(timestamp),
          user: user,
          message: message,
          emotes: this.extractEmotes(message, emotes),
          isSubscriber: Math.random() < 0.3,
          isModerator: user === 'mod_user',
          badges: []
        })
      }
    }
    
    return {
      vodId,
      messages: messages.sort((a, b) => a.timestamp - b.timestamp),
      totalMessages: messages.length,
      duration: duration
    }
  }

  // Extract emotes from message
  extractEmotes(message, emoteList) {
    const foundEmotes = []
    emoteList.forEach(emote => {
      if (message.includes(emote)) {
        foundEmotes.push(emote)
      }
    })
    return foundEmotes
  }
}

export default TwitchService