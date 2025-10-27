# Cricket Betting Agent Frontend

A modern React frontend for the AI Cricket Betting Agent backend, built with TypeScript, Tailwind CSS, and Socket.IO for real-time updates.

## Features

### 🏏 Live Matches Dashboard
- Real-time cricket match display with live scores
- Match status indicators (live, finished, upcoming)
- Team information and venue details
- Auto-refresh with manual refresh option
- Socket.IO integration for live updates

### 🧠 AI Question Interface
- Display ML-generated betting questions in real-time
- Question categories: batting, bowling, match outcome, player performance
- Difficulty levels: easy, medium, hard
- Confidence scores and ML enhancement indicators
- Interactive filtering by category, difficulty, and confidence

### 📊 System Monitoring Dashboard
- Real-time system health status
- API response times and success rates
- Cache hit rates and performance metrics
- Socket.IO connection statistics
- Error logs and alert management

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom cricket theme
- **Real-time Communication**: Socket.IO Client
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Charts**: Recharts (for future enhancements)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:5000`

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd cricket-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application

### Backend Integration

The frontend is designed to work with the AI Cricket Betting Agent backend. Make sure your backend is running on `http://localhost:5000` with the following services:

- **REST API**: Live matches, questions, health checks
- **Socket.IO**: Real-time updates and events
- **SportMonks API**: Cricket data source
- **Redis**: Caching layer
- **MongoDB**: Data persistence

## API Endpoints Used

### REST Endpoints
- `GET /api/live-matches` - Live cricket matches
- `GET /api/questions/match/:matchId/questions` - ML-generated questions
- `GET /api/fixture/:id` - Detailed match information
- `GET /api/player/:id` - Player statistics
- `GET /health` - System health status
- `GET /monitoring/status` - System monitoring data
- `GET /api/test-connection` - Backend connection test

### Socket.IO Events
- `matches:data` - Live match updates
- `matches:update` - Match changes
- `matches:live` - Real-time match data
- `questions:generated` - New AI questions
- `questions:new` - Question updates

## Project Structure

```
src/
├── components/
│   ├── LiveMatches.tsx      # Live matches dashboard
│   ├── Questions.tsx        # AI questions interface
│   └── Monitoring.tsx       # System monitoring
├── services/
│   ├── apiService.ts        # REST API client
│   └── socketService.ts    # Socket.IO client
├── App.tsx                  # Main application component
├── index.tsx               # Application entry point
└── index.css               # Tailwind CSS imports
```

## Features in Detail

### Real-time Updates
- Automatic Socket.IO connection with auto-reconnect
- Live match score updates without page refresh
- Real-time AI question generation
- Connection status indicators

### Error Handling
- Comprehensive error boundaries
- Fallback mechanisms for API failures
- Graceful degradation when services are unavailable
- User-friendly error messages

### Responsive Design
- Mobile-first responsive layout
- Touch-friendly interface
- Adaptive navigation for mobile devices
- Optimized for all screen sizes

### Performance
- Efficient state management
- Optimized re-renders
- Lazy loading of components
- Cached API responses

## Customization

### Styling
The application uses Tailwind CSS with a custom cricket theme. You can customize colors in `tailwind.config.js`:

```javascript
colors: {
  cricket: {
    green: '#22c55e',
    dark: '#1f2937',
    gold: '#f59e0b',
  }
}
```

### API Configuration
Update the API base URL in `src/services/apiService.ts`:

```typescript
const API_BASE_URL = 'http://your-backend-url:port';
```

### Socket.IO Configuration
Update the Socket.IO server URL in `src/services/socketService.ts`:

```typescript
constructor(serverUrl: string = 'http://your-backend-url:port')
```

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Adding New Features

1. Create new components in `src/components/`
2. Add new API methods in `src/services/apiService.ts`
3. Update Socket.IO events in `src/services/socketService.ts`
4. Add new routes in `src/App.tsx`

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure backend is running on `http://localhost:5000`
   - Check CORS configuration in backend
   - Verify API endpoints are accessible

2. **Socket.IO Connection Issues**
   - Check Socket.IO server is running
   - Verify WebSocket support in browser
   - Check network connectivity

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check if PostCSS is installed
   - Verify Tailwind directives in `index.css`

### Debug Mode

Enable debug logging by opening browser developer tools and checking the console for detailed API and Socket.IO logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the backend documentation
3. Check browser console for errors
4. Verify network connectivity

---

Built with ❤️ for cricket enthusiasts and AI betting enthusiasts!