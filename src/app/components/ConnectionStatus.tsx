'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createPresenceSocket, createMessagingSocket, createChatSocket, Socket } from '../../lib/websocket';

type ConnectionStatus = {
  presence: 'connected' | 'disconnected' | 'connecting' | 'error';
  messaging: 'connected' | 'disconnected' | 'connecting' | 'error';
  chat: 'connected' | 'disconnected' | 'connecting' | 'error';
};

export default function ConnectionStatus() {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>({
    presence: 'disconnected',
    messaging: 'disconnected',
    chat: 'disconnected',
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setStatus({
        presence: 'disconnected',
        messaging: 'disconnected',
        chat: 'disconnected',
      });
      return;
    }

    // Presence socket
    const presenceSocket = createPresenceSocket();
    presenceSocket.on('connect', () => {
      setStatus(prev => ({ ...prev, presence: 'connected' }));
    });
    presenceSocket.on('disconnect', () => {
      setStatus(prev => ({ ...prev, presence: 'disconnected' }));
    });
    presenceSocket.on('connect_error', () => {
      setStatus(prev => ({ ...prev, presence: 'error' }));
    });
    presenceSocket.on('presence:online-users', (users: any[]) => {
      setOnlineUsers(users.length);
    });

    // Messaging socket
    const messagingSocket = createMessagingSocket();
    messagingSocket.on('connect', () => {
      setStatus(prev => ({ ...prev, messaging: 'connected' }));
    });
    messagingSocket.on('disconnect', () => {
      setStatus(prev => ({ ...prev, messaging: 'disconnected' }));
    });
    messagingSocket.on('connect_error', () => {
      setStatus(prev => ({ ...prev, messaging: 'error' }));
    });

    // Chat socket
    const chatSocket = createChatSocket();
    chatSocket.on('connect', () => {
      setStatus(prev => ({ ...prev, chat: 'connected' }));
    });
    chatSocket.on('disconnect', () => {
      setStatus(prev => ({ ...prev, chat: 'disconnected' }));
    });
    chatSocket.on('connect_error', () => {
      setStatus(prev => ({ ...prev, chat: 'error' }));
    });

    // Set connecting state initially
    setStatus({
      presence: 'connecting',
      messaging: 'connecting',
      chat: 'connecting',
    });

    return () => {
      presenceSocket.disconnect();
      messagingSocket.disconnect();
      chatSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return '#10b981'; // green
      case 'connecting':
        return '#f59e0b'; // yellow
      case 'error':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return '●';
      case 'connecting':
        return '⟳';
      case 'error':
        return '✕';
      default:
        return '○';
    }
  };

  const allConnected = status.presence === 'connected' && 
                       status.messaging === 'connected' && 
                       status.chat === 'connected';

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 24,
        zIndex: 1000,
      }}
    >
      {/* Compact Status Indicator */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '8px 16px',
          background: allConnected ? '#10b981' : '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        }}
      >
        <span style={{ fontSize: 16 }}>
          {allConnected ? '🟢' : '🟡'}
        </span>
        <span>
          {allConnected ? 'Connected' : 'Connecting...'}
        </span>
        {onlineUsers > 0 && (
          <span style={{
            background: 'rgba(255,255,255,0.3)',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 11,
          }}>
            {onlineUsers} online
          </span>
        )}
      </button>

      {/* Expanded Status Panel */}
      {isExpanded && (
        <div
          style={{
            marginTop: 8,
            padding: 16,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            minWidth: 280,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>
              Connection Status
            </h4>
            
            {/* Presence Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: getStatusColor(status.presence) }}>
                  {getStatusIcon(status.presence)}
                </span>
                <span style={{ fontSize: 13, color: '#111827' }}>Presence</span>
              </div>
              <span style={{ 
                fontSize: 11, 
                color: getStatusColor(status.presence),
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>
                {status.presence}
              </span>
            </div>

            {/* Messaging Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: getStatusColor(status.messaging) }}>
                  {getStatusIcon(status.messaging)}
                </span>
                <span style={{ fontSize: 13, color: '#111827' }}>Messaging</span>
              </div>
              <span style={{ 
                fontSize: 11, 
                color: getStatusColor(status.messaging),
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>
                {status.messaging}
              </span>
            </div>

            {/* Chat Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: getStatusColor(status.chat) }}>
                  {getStatusIcon(status.chat)}
                </span>
                <span style={{ fontSize: 13, color: '#111827' }}>AI Chat</span>
              </div>
              <span style={{ 
                fontSize: 11, 
                color: getStatusColor(status.chat),
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>
                {status.chat}
              </span>
            </div>
          </div>

          {/* Online Users Count */}
          <div style={{
            padding: '12px',
            background: '#f9fafb',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
              Online Users
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
              {onlineUsers}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '8px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              fontSize: 12,
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

