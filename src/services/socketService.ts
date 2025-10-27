import io from 'socket.io-client';

export interface SocketStats {
  eventsReceived: number;
  questionsReceived: number;
  averageLatency: number;
  isConnected: boolean;
  uptimeSeconds: number;
  lastEventTime: string | null;
}

class SocketService {
  private socket: any = null;
  private serverUrl: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private stats: SocketStats = {
    eventsReceived: 0,
    questionsReceived: 0,
    averageLatency: 0,
    isConnected: false,
    uptimeSeconds: 0,
    lastEventTime: null,
  };
  private latencyMeasurements: number[] = [];
  private connectionTime: Date | null = null;

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
    console.log('SocketService initialized with server URL:', this.serverUrl);
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Connecting to Socket.IO server:', this.serverUrl);

      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionTime = new Date();
        this.stats.isConnected = true;
        
        console.log('Connected to Socket.IO server:', this.socket?.id);
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('Socket.IO connection error:', error);
        console.error('Error details:', {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type,
          serverUrl: this.serverUrl
        });
        this.isConnected = false;
        this.stats.isConnected = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
        reject(error);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnected = false;
        this.stats.isConnected = false;
        
        if (reason !== 'io client disconnect') {
          this.scheduleReconnect();
        }
      });
    });
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    ) + Math.random() * 1000;

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch(console.error);
      }
    }, delay);
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Match events
    this.socket.on('matches:data', (data: any) => {
      this.handleEvent('matches:data', data);
    });

    this.socket.on('matches:update', (data: any) => {
      this.handleEvent('matches:update', data);
    });

    this.socket.on('matches:live', (data: any) => {
      this.handleEvent('matches:live', data);
    });

    this.socket.on('matches:new', (data: any) => {
      this.handleEvent('matches:new', data);
    });

    this.socket.on('matches:finished', (data: any) => {
      this.handleEvent('matches:finished', data);
    });

    // Question events
    this.socket.on('questions:generated', (data: any) => {
      this.handleQuestionEvent('questions:generated', data);
    });

    this.socket.on('questions:new', (data: any) => {
      this.handleQuestionEvent('questions:new', data);
    });

    // Generic event handler
    this.socket.onAny((eventName: string, data: any) => {
      if (!eventName.startsWith('matches:') && !eventName.startsWith('questions:')) {
        this.handleEvent(eventName, data);
      }
    });
  }

  private handleEvent(eventType: string, data: any) {
    this.stats.eventsReceived++;
    this.stats.lastEventTime = new Date().toISOString();
    
    const latency = this.calculateLatency(data);
    
    console.log(`Socket Event: ${eventType}`, {
      latency: latency ? latency.latencyMs : 'N/A',
      data: data
    });

    // Emit custom events for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('socket-event', {
        detail: { eventType, data, latency }
      }));
    }
  }

  private handleQuestionEvent(eventType: string, data: any) {
    this.stats.questionsReceived++;
    this.stats.eventsReceived++;
    this.stats.lastEventTime = new Date().toISOString();
    
    const latency = this.calculateLatency(data);
    
    console.log(`Socket Question Event: ${eventType}`, {
      latency: latency ? latency.latencyMs : 'N/A',
      data: data
    });

    // Emit custom events for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('socket-question', {
        detail: { eventType, data, latency }
      }));
    }
  }

  private calculateLatency(eventData: any): { latencyMs: number; eventTimestamp: string } | null {
    if (!eventData.timestamp) return null;

    const eventTime = new Date(eventData.timestamp).getTime();
    const receiveTime = Date.now();
    const latency = receiveTime - eventTime;

    this.latencyMeasurements.push(latency);
    this.stats.averageLatency = this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length;

    return {
      latencyMs: latency,
      eventTimestamp: eventData.timestamp,
    };
  }

  subscribeToLiveMatches() {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot subscribe: not connected to server');
      return false;
    }

    this.socket.emit('matches:subscribe');
    console.log('Subscribed to live match updates');
    return true;
  }

  unsubscribeFromLiveMatches() {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot unsubscribe: not connected to server');
      return false;
    }

    this.socket.emit('matches:unsubscribe');
    console.log('Unsubscribed from live match updates');
    return true;
  }

  requestCurrentMatches() {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot request matches: not connected to server');
      return false;
    }

    this.socket.emit('matches:request');
    console.log('Requested current matches');
    return true;
  }

  subscribeToQuestions(matchId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot subscribe to questions: not connected to server');
      return false;
    }

    this.socket.emit('questions:subscribe', { matchId });
    console.log(`Subscribed to questions for match: ${matchId}`);
    return true;
  }

  unsubscribeFromQuestions(matchId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot unsubscribe from questions: not connected to server');
      return false;
    }

    this.socket.emit('questions:unsubscribe', { matchId });
    console.log(`Unsubscribed from questions for match: ${matchId}`);
    return true;
  }

  getStats(): SocketStats {
    return {
      ...this.stats,
      uptimeSeconds: this.connectionTime ? 
        Math.floor((Date.now() - this.connectionTime.getTime()) / 1000) : 0
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.stats.isConnected = false;
    console.log('Disconnected from Socket.IO server');
  }
}

export const socketService = new SocketService();
