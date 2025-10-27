import React, { useState, useEffect, useRef } from 'react';
import { apiService, Question } from '../services/apiService';
import { socketService } from '../services/socketService';
import { Brain, Target, Clock, CheckCircle, XCircle } from 'lucide-react';

interface QuestionsProps {
  selectedMatchId: string;
}

const Questions: React.FC<QuestionsProps> = ({ selectedMatchId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: 'yes' | 'no' | null }>({});
  const previousMatchId = useRef<string>('');

  useEffect(() => {
    if (selectedMatchId) {
      // Unsubscribe from previous match
      if (previousMatchId.current && previousMatchId.current !== selectedMatchId) {
        socketService.unsubscribeFromQuestions(previousMatchId.current);
      }
      
      // Subscribe to new match questions via WebSocket
      socketService.subscribeToQuestions(selectedMatchId);
      previousMatchId.current = selectedMatchId;
      
      // Also load initial questions via REST API
      loadQuestions();
    } else {
      setQuestions([]);
      setSelectedAnswers({});
    }

    // Cleanup: unsubscribe when component unmounts or match changes
    return () => {
      if (previousMatchId.current) {
        socketService.unsubscribeFromQuestions(previousMatchId.current);
      }
    };
  }, [selectedMatchId]);

  // Listen to WebSocket question events
  useEffect(() => {
    const handleSocketQuestion = (event: CustomEvent) => {
      const { eventType, data } = event.detail;
      
      console.log('Received socket question event:', eventType, data);
      
      if (eventType === 'questions:new' && data && data.questions) {
        // Check if this question is for the current match
        if (data.matchId === selectedMatchId) {
          console.log(`New questions received for match ${data.matchId}:`, data.questions);
          
          // Map backend question structure to frontend structure
          const mappedQuestions = data.questions.map((q: any) => ({
            questionId: q.questionId,
            question: q.questionText || q.question, // Backend may use questionText
            category: q.category,
            difficulty: q.difficulty,
            mlEnhanced: q.mlEnhanced || false,
            matchId: q.matchId || data.matchId,
            timestamp: q.timestamp,
            // Map additional backend fields if present
            questionText: q.questionText,
            eventType: q.eventType,
            mlTarget: q.mlTarget,
            predictionWeight: q.predictionWeight,
          }));

          setQuestions(prevQuestions => {
            // Merge new questions with existing ones, avoiding duplicates
            const existingIds = new Set(prevQuestions.map(q => q.questionId));
            const newQuestions = mappedQuestions.filter((q: Question) => !existingIds.has(q.questionId));
            
            if (newQuestions.length > 0) {
              console.log(`Adding ${newQuestions.length} new questions`);
              return [...prevQuestions, ...newQuestions];
            }
            
            return prevQuestions;
          });
        }
      }
    };

    // Add event listener
    window.addEventListener('socket-question', handleSocketQuestion as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('socket-question', handleSocketQuestion as EventListener);
    };
  }, [selectedMatchId]);

  const loadQuestions = async () => {
    if (!selectedMatchId) {
      setError('Please select a match first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Loading questions for match:', selectedMatchId);
      const response = await apiService.getQuestions(selectedMatchId);
      console.log('Questions response:', response);
      
      if (response.success && response.data) {
        let questions = response.data.questions || [];
        console.log(`Received ${questions.length} questions for match ${selectedMatchId}`);
        console.log('Questions data:', questions);
        
        // Debug: Log first question structure
        if (questions.length > 0) {
          console.log('First question structure:', questions[0]);
          console.log('Question fields:', {
            question: questions[0].question,
            questionText: questions[0].questionText,
            category: questions[0].category
          });
        }
        
        // Replace placeholders with fallback values if needed
        questions = questions.map((q: any) => {
          // Backend may send 'questionText' instead of 'question'
          let questionText = q.question || q.questionText || '';
          
          // Debug empty questions
          if (!questionText || questionText.trim() === '') {
            console.warn('Empty question text found:', q);
          }
          
          // Replace various placeholders with defaults
          if (questionText.includes('{probability}')) {
            questionText = questionText.replace(/\{probability\}/g, '50%');
          }
          if (questionText.includes('{mlScore}')) {
            questionText = questionText.replace(/\{mlScore\}/g, 'moderate');
          }
          if (questionText.includes('{predictedBoundaries}')) {
            questionText = questionText.replace(/\{predictedBoundaries\}/g, 'several');
          }
          if (questionText.includes('[eventType]')) {
            questionText = questionText.replace(/\[eventType\]/g, 'the match');
          }
          
          // Replace confidence placeholder with actual confidence or default
          if (questionText.includes('{confidence}')) {
            const confidence = q.confidence ? `${Math.round(q.confidence)}` : '75';
            questionText = questionText.replace(/\{confidence\}/g, confidence);
          }
          
          // Log any remaining placeholders
          if (questionText.includes('{') || questionText.includes('[')) {
            console.warn('Question with unresolved placeholder:', questionText);
          }
          
          return {
            ...q,
            question: questionText
          };
        });
        
        setQuestions(questions);
        // Initialize answers as null
        const initialAnswers: { [questionId: string]: 'yes' | 'no' | null } = {};
        questions.forEach((q: Question) => {
          initialAnswers[q.questionId] = null;
        });
        setSelectedAnswers(initialAnswers);
      } else {
        console.warn('Failed to load questions:', response);
        setQuestions([]);
        setSelectedAnswers({});
        setError('No questions available for this match');
      }
    } catch (error) {
      setError('Failed to load questions');
      console.error('Error loading questions:', error);
      setQuestions([]);
      setSelectedAnswers({});
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: 'yes' | 'no') => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'status-upcoming';
      case 'medium':
        return 'status-live';
      case 'hard':
        return 'status-finished';
      default:
        return 'status-finished';
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Bets</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={24} color="#22c55e" />
          <span style={{ fontSize: '14px', color: '#6c757d' }}>ML Enhanced</span>
        </div>
      </div>

      {!selectedMatchId && (
        <div className="loading">
          <Brain size={48} color="#dee2e6" />
          <p>Select a match from the left sidebar to view betting options</p>
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div className="spinner"></div>
            <span>Loading betting options...</span>
          </div>
        </div>
      )}

      {selectedMatchId && !loading && (
        <div>
          {questions.length === 0 ? (
            <div className="loading">
              <Brain size={48} color="#dee2e6" />
              <p>No betting options available for this match</p>
              <p style={{ fontSize: '14px', color: '#6c757d' }}>
                {selectedMatchId.startsWith('ml-test') 
                  ? 'This is a test match. Questions should be available.' 
                  : 'Questions will appear here when betting options are generated for this match.'}
              </p>
              <div style={{ marginTop: '16px', fontSize: '12px', color: '#dc3545', backgroundColor: '#f8d7da', padding: '12px', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                <p><strong>⚠️ Debug Info:</strong></p>
                <p>Match ID: <code>{selectedMatchId}</code></p>
                <p>Questions in DB: 0</p>
                <p style={{ marginTop: '8px' }}><strong>Possible Solutions:</strong></p>
                <ul style={{ textAlign: 'left', marginTop: '8px', marginLeft: '20px' }}>
                  <li>Check if the backend has generated questions for this match ID</li>
                  <li>Try using a different match ID that has questions in the database</li>
                  <li>Check backend logs to see if question generation is working</li>
                  <li>Verify the database connection and if questions are stored correctly</li>
                </ul>
              </div>
              <div style={{ marginTop: '16px', fontSize: '12px', color: '#6c757d' }}>
                <p><strong>Expected test matches:</strong></p>
                <ul style={{ textAlign: 'left', marginTop: '8px' }}>
                  <li>ml-test-odi-1 - ODI match questions</li>
                  <li>ml-test-t20-1 - T20 match questions</li>
                  <li>test_match_1 - Test match questions</li>
                </ul>
              </div>
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={`question-${question.questionId}-${question.matchId || 'unknown'}-${index}`} className="match-card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={16} />
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#6c757d' }}>{question.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`match-status ${getDifficultyClass(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    {question.mlEnhanced && (
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#28a745' }}>
                        ML Enhanced
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '18px', fontWeight: '500', lineHeight: '1.5', marginBottom: '16px' }}>
                    {question.question}
                  </p>
                  
                  {/* ML Prediction Info */}
                  {question.mlTarget && (
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      marginBottom: '16px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6c757d' }}>ML Target:</span>
                          <span style={{ fontSize: '14px', marginLeft: '8px', color: '#495057' }}>{question.mlTarget}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6c757d' }}>Prediction Weight:</span>
                          <span style={{ fontSize: '14px', marginLeft: '8px', color: '#495057' }}>{question.predictionWeight}</span>
                        </div>
                      </div>
                      {question.eventType && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6c757d' }}>Event Type:</span>
                          <span style={{ fontSize: '14px', marginLeft: '8px', color: '#495057' }}>{question.eventType}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Yes/No Options */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button
                      onClick={() => handleAnswerSelect(question.questionId, 'yes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        border: selectedAnswers[question.questionId] === 'yes' ? '2px solid #22c55e' : '2px solid #dee2e6',
                        borderRadius: '8px',
                        backgroundColor: selectedAnswers[question.questionId] === 'yes' ? '#f0f9ff' : 'white',
                        color: selectedAnswers[question.questionId] === 'yes' ? '#22c55e' : '#6c757d',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '16px'
                      }}
                    >
                      <CheckCircle size={20} />
                      YES
                    </button>
                    
                    <button
                      onClick={() => handleAnswerSelect(question.questionId, 'no')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        border: selectedAnswers[question.questionId] === 'no' ? '2px solid #dc3545' : '2px solid #dee2e6',
                        borderRadius: '8px',
                        backgroundColor: selectedAnswers[question.questionId] === 'no' ? '#fef2f2' : 'white',
                        color: selectedAnswers[question.questionId] === 'no' ? '#dc3545' : '#6c757d',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '16px'
                      }}
                    >
                      <XCircle size={20} />
                      NO
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6c757d', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  {question.timestamp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} />
                      <span>{new Date(question.timestamp).toLocaleString()}</span>
                    </div>
                  )}
                  {question.matchId && (
                    <span>Match ID: {question.matchId}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Questions;