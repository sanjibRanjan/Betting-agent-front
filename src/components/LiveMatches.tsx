import React, { useState, useEffect } from 'react';
import { apiService, Match } from '../services/apiService';
import { Activity, RefreshCw, Target, Copy } from 'lucide-react';

const LiveMatches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getLiveMatches();
      console.log('Live matches response:', response);

      if (response.success && response.data) {
        // Validate response structure
        if (!response.data.matches || !Array.isArray(response.data.matches)) {
          console.error('Invalid matches data structure:', response.data);
          setError('Invalid data format received from server');
          return;
        }

        // Filter out invalid match objects and remove duplicates
        const validMatches = response.data.matches.filter(match => {
          if (!match || typeof match !== 'object') {
            console.warn('Invalid match object found:', match);
            return false;
          }
          return true;
        });

        // Remove duplicate matches based on ID
        const uniqueMatches = validMatches.reduce((acc, match) => {
          const existingMatch = acc.find(m => m.id === match.id);
          if (!existingMatch) {
            acc.push(match);
          } else {
            console.warn(`Duplicate match found with ID ${match.id}, keeping first occurrence`);
          }
          return acc;
        }, [] as Match[]);

        // Filter to only show live matches
        const liveMatches = uniqueMatches.filter(match => match.status.toLowerCase() === 'live');

        setMatches(liveMatches);
        setLastUpdate(new Date().toISOString());

        const totalFilteredOut = response.data.matches.length - liveMatches.length;
        if (totalFilteredOut > 0) {
          console.warn(`Filtered out ${totalFilteredOut} matches (${response.data.matches.length - uniqueMatches.length} invalid/duplicate + ${uniqueMatches.length - liveMatches.length} non-live matches)`);
        }
      } else {
        console.error('API response indicates failure:', response);
        setError('Failed to load matches - server error');
      }
    } catch (error) {
      setError('Failed to load matches');
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.refreshLiveMatches();
      
      if (response.success && response.data) {
        // Validate response structure
        if (!response.data.matches || !Array.isArray(response.data.matches)) {
          console.error('Invalid matches data structure on refresh:', response.data);
          setError('Invalid data format received from server');
          return;
        }
        
        // Filter out invalid match objects and remove duplicates
        const validMatches = response.data.matches.filter(match => {
          if (!match || typeof match !== 'object') {
            console.warn('Invalid match object found on refresh:', match);
            return false;
          }
          return true;
        });

        // Remove duplicate matches based on ID
        const uniqueMatches = validMatches.reduce((acc, match) => {
          const existingMatch = acc.find(m => m.id === match.id);
          if (!existingMatch) {
            acc.push(match);
          } else {
            console.warn(`Duplicate match found with ID ${match.id} on refresh, keeping first occurrence`);
          }
          return acc;
        }, [] as Match[]);

        // Filter to only show live matches
        const liveMatches = uniqueMatches.filter(match => match.status.toLowerCase() === 'live');

        setMatches(liveMatches);
        setLastUpdate(new Date().toISOString());

        const totalFilteredOut = response.data.matches.length - liveMatches.length;
        if (totalFilteredOut > 0) {
          console.warn(`Filtered out ${totalFilteredOut} matches on refresh (${response.data.matches.length - uniqueMatches.length} invalid/duplicate + ${uniqueMatches.length - liveMatches.length} non-live matches)`);
        }
      } else {
        console.error('API refresh response indicates failure:', response);
        setError('Failed to refresh matches - server error');
      }
    } catch (error) {
      setError('Failed to refresh matches');
      console.error('Error refreshing matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
        return 'status-live';
      case 'finished':
        return 'status-finished';
      case 'upcoming':
        return 'status-upcoming';
      default:
        return 'status-finished';
    }
  };

  const copyMatchId = async (matchId: string | number) => {
    try {
      await navigator.clipboard.writeText(String(matchId));
      setCopiedId(String(matchId));
      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy match ID:', error);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Live Cricket Matches</h2>
        <button
          onClick={refreshMatches}
          disabled={loading}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {lastUpdate && (
        <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '16px' }}>
          Last updated: {new Date(lastUpdate).toLocaleString()}
        </p>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="loading">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div className="spinner"></div>
            <span>Loading matches...</span>
          </div>
        </div>
      ) : (
        <div>
          {matches.length === 0 ? (
            <div className="loading">
              <Target size={48} color="#dee2e6" />
              <p>No matches available</p>
            </div>
          ) : (
            matches.map((match, index) => {
              // Enhanced error handling and validation
              if (!match.id) {
                console.error('Match object missing required id property:', match);
                return null;
              }
              
              if (!match.title) {
                console.warn(`Match ${match.id} is missing title property, using fallback`);
              }
              
              // Validate required team data
              if (!match.localteam?.name || !match.visitorteam?.name) {
                console.warn(`Match ${match.id} is missing team information:`, {
                  localteam: match.localteam,
                  visitorteam: match.visitorteam
                });
              }
              
              // Use a combination of ID, type, and index to ensure unique keys
              const uniqueKey = `match-${match.id}-${match.status || 'unknown'}-${index}`;
              
              return (
              <div key={uniqueKey} className="match-card">
                {/* Display match title with fallback */}
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#212529' }}>
                  {match.title || `Match ${match.id}`}
                </div>

                {/* Match ID with copy functionality */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>ID:</span>
                  <button
                    onClick={() => copyMatchId(match.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: copiedId === String(match.id) ? '#d4edda' : '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: copiedId === String(match.id) ? '#155724' : '#495057',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = copiedId === String(match.id) ? '#c3e6cb' : '#e9ecef';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = copiedId === String(match.id) ? '#d4edda' : '#f8f9fa';
                    }}
                  >
                    <Copy size={12} />
                    <span>{String(match.id)}</span>
                    {copiedId === String(match.id) && (
                      <span style={{ fontSize: '10px', color: '#155724' }}>Copied!</span>
                    )}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color={match.status.toLowerCase() === 'live' ? '#dc3545' : '#6c757d'} />
                    <span className={`match-status ${getStatusClass(match.status)}`}>
                      {match.status.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', color: '#6c757d' }}>
                    {new Date(match.starting_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                        {match?.localteam?.name || 'Team A'}
                      </div>
                      {match?.localteam?.score ? (
                        <div style={{ fontSize: '16px', color: '#dc3545', fontWeight: 'bold' }}>
                          {match.localteam.score}
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>
                          {match?.localteam?.code || 'TEA'}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6c757d' }}>VS</div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                        {match?.visitorteam?.name || 'Team B'}
                      </div>
                      {match?.visitorteam?.score ? (
                        <div style={{ fontSize: '16px', color: '#dc3545', fontWeight: 'bold' }}>
                          {match.visitorteam.score}
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>
                          {match?.visitorteam?.code || 'TEB'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {match.venue && (
                  <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                    <strong>Venue:</strong> {match?.venue?.name || 'Unknown Venue'}, {match?.venue?.city || 'Unknown City'}
                  </div>
                )}

                {match.toss && (
                  <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                    <strong>Toss:</strong> {match.toss}
                  </div>
                )}

                {match.result?.message && (
                  <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 'bold', color: '#dc3545' }}>
                    Result: {match.result.message}
                  </div>
                )}

                {match.live_score && !match.result?.message && (
                  <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>
                    Live Score: {match.live_score}
                  </div>
                )}
              </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default LiveMatches;