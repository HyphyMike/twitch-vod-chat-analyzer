import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Header() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          📺 Twitch VOD Analyzer
        </Link>
        <nav className="nav">
          <Link to="/" className={isActive('/')}>
            Dashboard
          </Link>
          <Link to="/clips" className={isActive('/clips')}>
            Clips Gallery
          </Link>
          <Link to="/settings" className={isActive('/settings')}>
            Settings
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header