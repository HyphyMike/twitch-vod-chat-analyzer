# 📺 Twitch VOD Chat Analyzer

A complete web application for analyzing Twitch VOD chat data and automatically generating highlight clips based on chat interaction peaks.

## ✨ Features

### 🎥 VOD Player Integration
- Embedded Twitch VOD player (no authentication required)
- Standard video controls and metadata display
- Direct VOD URL support and streamer search functionality

### 📊 Chat Analysis Engine
- Real-time chat data parsing and analysis
- Intelligent interaction peak detection based on:
  - Message frequency spikes
  - Emote usage patterns
  - User engagement metrics
  - Subscriber activity
- Configurable sensitivity thresholds
- Visual timeline and statistics

### 🎬 Automatic Clip Generation
- Generate 60-second video clips from interaction peaks
- Clips start 60 seconds before peak and end at peak moment
- Customizable clip duration and timing
- Multiple output formats (MP4, WebM, AVI)
- Quality settings (480p to source)

### 🖥️ User Interface
- Modern, responsive web interface with Twitch-inspired theming
- Real-time analysis visualization with interactive charts
- Comprehensive clips gallery with preview and download
- Advanced settings panel for fine-tuning
- Progress indicators and status updates

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- FFmpeg (for video processing - optional for demo mode)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HyphyMike/twitch-vod-chat-analyzer.git
   cd twitch-vod-chat-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Twitch API credentials (optional for demo)
   ```

4. **Start the development environment**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔧 Configuration

### Twitch API Setup (Optional)

For full functionality with real Twitch data:

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application
3. Set OAuth Redirect URL to: `http://localhost:3001/auth/callback`
4. Copy your Client ID and Client Secret to the `.env` file:
   ```
   TWITCH_CLIENT_ID=your_client_id_here
   TWITCH_CLIENT_SECRET=your_client_secret_here
   ```

### Analysis Settings

Configure chat analysis sensitivity in the Settings panel:
- **Message Threshold**: Minimum messages per minute for peak detection
- **Emote Threshold**: Minimum emotes per minute to boost interaction score
- **Peak Window Size**: Time window for averaging activity
- **Minimum Peak Distance**: Minimum time between detected peaks

### Clip Generation Settings

Customize clip output in the Settings panel:
- **Clip Duration**: Total length of generated clips (30-300 seconds)
- **Start Offset**: How many seconds before peak to start clip
- **Video Format**: Output format (MP4, WebM, AVI)
- **Quality**: Video quality from 480p to source

## 🏗️ Architecture

### Frontend (React)
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Modern CSS** - Responsive design with CSS Grid/Flexbox

### Backend (Node.js + Express)
- **Express.js** - Web framework and API server
- **SQLite3** - Embedded database for storage
- **Axios** - HTTP client for Twitch API integration

### Key Components
- **TwitchService** - Handles Twitch API integration
- **ChatAnalyzer** - Processes chat data and detects peaks
- **ClipGenerator** - Manages video clip generation
- **DatabaseService** - Handles data persistence

## 📡 API Endpoints

### VOD Management
- `GET /api/vod/:vodId` - Get VOD metadata
- `GET /api/search?q={query}` - Search for VODs
- `GET /api/vod/:vodId/chat` - Get chat logs

### Analysis
- `POST /api/analyze` - Analyze VOD chat for peaks
- `GET /api/analysis/:vodId` - Get stored analysis

### Clips
- `POST /api/generate-clips` - Generate clips from peaks
- `GET /api/clips` - List all generated clips
- `GET /api/clips/:id/download` - Download clip file
- `DELETE /api/clips/:id` - Delete clip

### Settings
- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings

## 📊 Demo Mode

The application includes a demo mode with mock data:
- **Mock Chat Data**: Realistic chat messages with artificial peaks
- **Simulated Analysis**: Demonstrates peak detection algorithms
- **Mock Clips**: Placeholder files showing clip generation workflow

Perfect for testing and demonstration without Twitch API credentials.

## 🛠️ Development

### Project Structure
```
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
├── server/                # Express backend
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic
│   └── utils/             # Server utilities
├── data/                  # SQLite database and settings
├── clips/                 # Generated video clips
└── temp/                  # Temporary files
```

### Available Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build frontend for production
- `npm run start` - Start production server
- `npm run server:dev` - Start backend only
- `npm run client:dev` - Start frontend only

### Technology Stack
- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express, SQLite3
- **Video Processing**: FFmpeg (planned)
- **Styling**: Modern CSS with CSS Variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Twitch for their robust API and developer tools
- React and Vite communities for excellent tooling
- FFmpeg project for video processing capabilities

## 📞 Support

For support, please open an issue on GitHub or contact the maintainers.

---

**Note**: This project is for educational and research purposes. Please ensure you comply with Twitch's Terms of Service and API guidelines when using real Twitch data.
