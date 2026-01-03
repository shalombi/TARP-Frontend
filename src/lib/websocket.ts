import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Get JWT token from cookies
function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'accessToken') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Create socket connection with authentication
export function createSocket(namespace: string = '/'): Socket {
  const token = getToken();
  
  const socket = io(`${API_URL}${namespace}`, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log(`✅ WebSocket connected to ${namespace}`, { socketId: socket.id });
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ WebSocket disconnected from ${namespace}:`, reason);
  });

  socket.on('connect_error', (error) => {
    console.error(`❌ WebSocket connection error to ${namespace}:`, error);
    // Don't show toast for connection errors - they're usually temporary
    // Authentication errors are handled by the guard disconnecting
  });

  socket.on('connected', (data: any) => {
    console.log(`✅ WebSocket authenticated on ${namespace}:`, data);
  });

  return socket;
}

// Chat socket
export function createChatSocket(): Socket {
  return createSocket('/chat');
}

// Experiments socket
export function createExperimentsSocket(): Socket {
  return createSocket('/experiments');
}

// Presence socket
export function createPresenceSocket(): Socket {
  return createSocket('/presence');
}

// Messaging socket
export function createMessagingSocket(): Socket {
  return createSocket('/messaging');
}

