import React, { useState, useEffect } from 'react';
import { Target, Activity, Server, Brain } from 'lucide-react';
import LiveMatches from './components/LiveMatches';
import Questions from './components/Questions';
import { apiService, Match } from './services/apiService';
import { mlService } from './services/mlService';
import { socketService } from './services/socketService';
import './App.css';

type TabType = 'matches' | 'questions';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [isConnected, setIsConnected] = useState(false);
  const [isMLConnected, setIsMLConnected] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  useEffect(() => {
    // Initialize WebSocket connection
    const initSocket = async () => {
      try {
        await socketService.connect();
        console.log('Socket.IO connected successfully');
        socketService.subscribeToLiveMatches();
      } catch (error) {
        console.error('Failed to connect to Socket.IO server:', error);
      }
    };

    // Test backend connections on app start
    testConnections();
    loadMatches();
    initSocket();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadMatches = async () => {
    try {
      const response = await apiService.getLiveMatches();
      if (response.success && response.data) {
        const liveMatches = response.data.matches || [];
        
        // Add test matches with questions for demonstration
        const testMatches: Match[] = [
          {
            id: 99999, // Use a number ID for TypeScript compatibility
            title: 'Test ODI Match - India vs Australia (3 Questions)',
            status: 'live',
            localteam: { id: 1, name: 'India', code: 'IND' },
            visitorteam: { id: 2, name: 'Australia', code: 'AUS' },
            venue: { id: 1, name: 'Test Stadium', city: 'Test City' },
            starting_at: new Date().toISOString(),
            live_score: '3 Questions Available'
          },
          {
            id: 99998,
            title: 'Test T20 Match - England vs Pakistan (3 Questions)',
            status: 'live',
            localteam: { id: 3, name: 'England', code: 'ENG' },
            visitorteam: { id: 4, name: 'Pakistan', code: 'PAK' },
            venue: { id: 2, name: 'T20 Stadium', city: 'T20 City' },
            starting_at: new Date().toISOString(),
            live_score: '3 Questions Available'
          },
          {
            id: 99997,
            title: 'Test Match - South Africa vs New Zealand (3 Questions)',
            status: 'live',
            localteam: { id: 5, name: 'South Africa', code: 'SA' },
            visitorteam: { id: 6, name: 'New Zealand', code: 'NZ' },
            venue: { id: 3, name: 'Test Ground', city: 'Test City' },
            starting_at: new Date().toISOString(),
            live_score: '3 Questions Available'
          },
          {
            id: 10753,
            title: 'Live Match - South Africa vs Australia (5 Questions)',
            status: 'finished',
            localteam: { id: 40, name: 'South Africa', code: 'SA' },
            visitorteam: { id: 36, name: 'Australia', code: 'AUS' },
            venue: { id: 4, name: 'Live Stadium', city: 'Live City' },
            starting_at: '2020-02-26T16:00:00.000Z',
            live_score: 'Australia won by 97 runs - 5 Questions Available'
          }
        ];
        
        setMatches([...testMatches, ...liveMatches]);
      } else {
        console.warn('Failed to load matches:', response);
        setMatches([]);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      setMatches([]);
    }
  };

  const testConnections = async () => {
    try {
      // Test main API server (Node.js - Port 3000)
      const apiResponse = await apiService.testConnection();
      setIsConnected(apiResponse.success);
      
      // Test ML service (Python - Port 5001)
      const mlResponse = await mlService.testConnection();
      setIsMLConnected(mlResponse.success);
      
      console.log('Connection Status:', {
        api: apiResponse.success ? 'Connected' : 'Disconnected',
        ml: mlResponse.success ? 'Connected' : 'Disconnected'
      });
    } catch (error) {
      setIsConnected(false);
      setIsMLConnected(false);
      console.error('Backend connection tests failed:', error);
    }
  };

  const tabs = [
    { id: 'questions' as TabType, label: 'Bets', icon: Target },
  ];

  const handleMatchSelect = (matchId: string) => {
    // For test matches, use the special test match ID for questions
    let questionMatchId = matchId;
    if (matchId === '99999') {
      questionMatchId = 'ml-test-odi-1';
    } else if (matchId === '99998') {
      questionMatchId = 'ml-test-t20-1';
    } else if (matchId === '99997') {
      questionMatchId = 'test_match_1';
    }
    setSelectedMatchId(questionMatchId);
    setActiveTab('questions');
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Target size={32} color="#22c55e" />
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Cricket Betting Agent</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* API Server Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} color={isConnected ? '#22c55e' : '#dc3545'} />
              <div className={`status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`}></div>
              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                API Server {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* ML Service Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={16} color={isMLConnected ? '#22c55e' : '#dc3545'} />
              <div className={`status-indicator ${isMLConnected ? 'status-connected' : 'status-disconnected'}`}></div>
              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                ML Service {isMLConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: '24px', minHeight: 'calc(100vh - 200px)' }}>
        {/* Left Sidebar - Live Matches */}
        <div style={{ width: '350px', flexShrink: 0 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Live Matches</h2>
              <Activity size={20} color="#22c55e" />
            </div>
            
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {matches.length === 0 ? (
                <div className="loading">
                  <Activity size={32} color="#dee2e6" />
                  <p>No matches available</p>
                </div>
              ) : (
                matches.map((match) => (
                  <div 
                    key={match.id} 
                    className="match-card"
                    style={{ 
                      cursor: 'pointer', 
                      marginBottom: '12px',
                      border: selectedMatchId === match.id.toString() ? '2px solid #22c55e' : '1px solid #dee2e6',
                      backgroundColor: selectedMatchId === match.id.toString() ? '#f0f9ff' : 'white'
                    }}
                    onClick={() => handleMatchSelect(match.id.toString())}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#212529' }}>
                      {match.title || `Match ${match.id}`}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={14} color={match.status.toLowerCase() === 'live' ? '#dc3545' : '#6c757d'} />
                        <span className={`match-status ${match.status.toLowerCase() === 'live' ? 'status-live' : match.status.toLowerCase() === 'finished' ? 'status-finished' : 'status-upcoming'}`}>
                          {match.status.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>
                        {new Date(match.starting_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {match?.localteam?.name || 'Team A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {match?.localteam?.code || 'TEA'}
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#6c757d', margin: '0 8px' }}>VS</div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {match?.visitorteam?.name || 'Team B'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {match?.visitorteam?.code || 'TEB'}
                        </div>
                      </div>
                    </div>

                    {match.venue && (
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                        <strong>Venue:</strong> {match?.venue?.name || 'Unknown Venue'}
                      </div>
                    )}

                    {match.live_score && (
                      <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 'bold', color: '#22c55e' }}>
                        Live Score: {match.live_score}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1 }}>
          {/* Navigation Tabs */}
          <div className="nav" style={{ marginBottom: '24px' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? 'active' : ''}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <main>
            <Questions selectedMatchId={selectedMatchId} />
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '48px', padding: '24px', textAlign: 'center', color: '#6c757d', borderTop: '1px solid #dee2e6' }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          AI Cricket Betting Agent Frontend - Built with React, TypeScript, and CSS
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
          Backend: Node.js Server (Port 3000) + Python ML Service (Port 5001)
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
          Real-time cricket data powered by SportMonks API
        </p>
      </footer>
    </div>
  );
}

export default App;
