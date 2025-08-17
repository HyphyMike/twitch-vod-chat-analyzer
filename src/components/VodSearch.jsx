import React, { useState } from 'react'

function VodSearch({ onVodSelect }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Check if it's a direct VOD URL
      if (searchQuery.includes('twitch.tv/videos/')) {
        const vodId = searchQuery.match(/videos\/(\d+)/)?.[1]
        if (vodId) {
          const response = await fetch(`/api/vod/${vodId}`)
          if (response.ok) {
            const vodData = await response.json()
            onVodSelect(vodData)
            return
          }
        }
      }

      // Search for VODs by streamer name or title
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResults(data.data || [])
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleVodClick = (vod) => {
    onVodSelect(vod)
    setSearchResults([])
    setSearchQuery('')
  }

  return (
    <div className="vod-search">
      <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Enter VOD URL or search by streamer/title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button 
            type="submit" 
            className="btn"
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? '🔄' : '🔍'} Search
          </button>
        </div>
      </form>

      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Search Results:</h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {searchResults.map((vod) => (
              <div 
                key={vod.id}
                className="search-result-item"
                style={{
                  padding: '0.75rem',
                  margin: '0.5rem 0',
                  backgroundColor: '#262626',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: '1px solid #464649',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleVodClick(vod)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#333333'
                  e.target.style.borderColor = '#9147ff'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#262626'
                  e.target.style.borderColor = '#464649'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {vod.title}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#adadb8' }}>
                  {vod.user_name} • {vod.duration} • {new Date(vod.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: '0.9rem', color: '#adadb8', marginTop: '1rem' }}>
        💡 <strong>Tip:</strong> You can paste a direct Twitch VOD URL (e.g., https://twitch.tv/videos/123456789) 
        or search for VODs by streamer name or title.
      </div>
    </div>
  )
}

export default VodSearch