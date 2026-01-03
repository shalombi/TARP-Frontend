'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createPresenceSocket, createMessagingSocket, Socket } from '../../lib/websocket';
import { showToast } from './Toast';

type OnlineUser = {
  userId: string;
  email: string;
  name: string;
  role: string;
  lastSeen: Date;
};

export default function OnlineUsers() {
  const { user, isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    fromUserId: string;
    fromUser: { name: string; email: string };
    message: string;
    createdAt: string;
  }>>([]);
  const presenceSocketRef = useRef<Socket | null>(null);
  const messagingSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Clean up existing connections first
    if (presenceSocketRef.current) {
      presenceSocketRef.current.disconnect();
    }
    if (messagingSocketRef.current) {
      messagingSocketRef.current.disconnect();
    }

    // Connect to presence
    const presenceSocket = createPresenceSocket();
    presenceSocketRef.current = presenceSocket;

    const handleOnlineUsers = (users: OnlineUser[]) => {
      setOnlineUsers(users.filter(u => u.userId !== user.id));
    };

    const handleUserOnline = (userData: OnlineUser) => {
      setOnlineUsers(prev => {
        if (prev.find(u => u.userId === userData.userId)) return prev;
        // Only show toast for new connections, not initial load
        if (prev.length > 0) {
          showToast(`${userData.name} is now online`, 'success', 2000);
        }
        return [...prev, userData];
      });
    };

    const handleUserOffline = (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const offlineUser = prev.find(u => u.userId === data.userId);
        if (offlineUser) {
          showToast(`${offlineUser.name} went offline`, 'info', 2000);
        }
        return prev.filter(u => u.userId !== data.userId);
      });
    };

    presenceSocket.on('presence:online-users', handleOnlineUsers);
    presenceSocket.on('presence:user-online', handleUserOnline);
    presenceSocket.on('presence:user-offline', handleUserOffline);

    // Connect to messaging
    const messagingSocket = createMessagingSocket();
    messagingSocketRef.current = messagingSocket;

    const handleNewMessage = (msg: any) => {
      setMessages(prev => {
        const newMessages = [...prev, msg];
        // Save to localStorage - determine which user's messages to save
        const targetUserId = msg.fromUserId === user?.id ? msg.toUserId : msg.fromUserId;
        if (targetUserId) {
          try {
            const relevantMessages = newMessages.filter(m => 
              (m.fromUserId === user?.id && m.toUserId === targetUserId) ||
              (m.fromUserId === targetUserId && m.toUserId === user?.id)
            );
            localStorage.setItem(
              `messages_${targetUserId}`,
              JSON.stringify(relevantMessages)
            );
          } catch (error) {
            console.error('Failed to save messages to localStorage:', error);
          }
        }
        return newMessages;
      });
      // Show notification if chat is not open or if it's from a different user
      if (!selectedUser || selectedUser.userId !== msg.fromUserId) {
        const senderName = msg.fromUser?.name || 'User';
        showToast(`New message from ${senderName}`, 'info', 3000);
      }
    };

    const handleMessageSent = (msg: any) => {
      setMessages(prev => {
        const newMessages = [...prev, msg];
        // Save to localStorage
        if (msg.toUserId) {
          try {
            localStorage.setItem(
              `messages_${msg.toUserId}`,
              JSON.stringify(newMessages.filter(m => 
                (m.fromUserId === user?.id && m.toUserId === msg.toUserId) ||
                (m.fromUserId === msg.toUserId && m.toUserId === user?.id)
              ))
            );
          } catch (error) {
            console.error('Failed to save messages to localStorage:', error);
          }
        }
        return newMessages;
      });
    };

    const handleMessageHistory = (history: any[]) => {
      const messagesList = history || [];
      setMessages(messagesList);
      // Save to localStorage for persistence
      if (selectedUser) {
        try {
          localStorage.setItem(
            `messages_${selectedUser.userId}`,
            JSON.stringify(messagesList)
          );
        } catch (error) {
          console.error('Failed to save messages to localStorage:', error);
        }
      }
    };

    messagingSocket.on('message:new', handleNewMessage);
    messagingSocket.on('message:sent', handleMessageSent);
    messagingSocket.on('message:history', handleMessageHistory);
    messagingSocket.on('error', (error: any) => {
      console.error('Messaging socket error:', error);
      // Don't show toast for authentication errors or if message is "Unauthorized"
      const errorMsg = error.message?.toLowerCase() || '';
      if (!errorMsg.includes('unauthorized') && !errorMsg.includes('authentication')) {
        showToast(error.message || 'Messaging error', 'error', 3000);
      }
    });
    
    // Handle reconnection - reload history if user is selected
    messagingSocket.on('connect', () => {
      if (selectedUser) {
        messagingSocket.emit('message:history', {
          userId: selectedUser.userId,
          limit: 50,
        });
      }
    });

    return () => {
      presenceSocket.off('presence:online-users', handleOnlineUsers);
      presenceSocket.off('presence:user-online', handleUserOnline);
      presenceSocket.off('presence:user-offline', handleUserOffline);
      messagingSocket.off('message:new', handleNewMessage);
      messagingSocket.off('message:sent', handleMessageSent);
      messagingSocket.off('message:history', handleMessageHistory);
      presenceSocket.disconnect();
      messagingSocket.disconnect();
    };
  }, [isAuthenticated, user, selectedUser]);

  // Load message history when user is selected or when socket reconnects
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }

    // First, try to load from localStorage for instant display
    try {
      const cached = localStorage.getItem(`messages_${selectedUser.userId}`);
      if (cached) {
        const cachedMessages = JSON.parse(cached);
        setMessages(cachedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages from localStorage:', error);
    }

    if (!messagingSocketRef.current) {
      return;
    }

    const socket = messagingSocketRef.current;
    
    // Then load from server to get latest messages
    const loadFromServer = () => {
      socket.emit('message:history', {
        userId: selectedUser.userId,
        limit: 50,
      });
    };
    
    // Check if socket is connected
    if (socket.connected) {
      // Load from server immediately
      loadFromServer();
    } else {
      // Wait for connection, then load
      const onConnect = () => {
        loadFromServer();
        socket.off('connect', onConnect);
      };
      socket.on('connect', onConnect);
    }
  }, [selectedUser]);

  const handleSendMessage = () => {
    if (!selectedUser || !message.trim() || !messagingSocketRef.current) return;

    messagingSocketRef.current.emit('message:send', {
      toUserId: selectedUser.userId,
      message: message.trim(),
    });

    setMessage('');
  };

  return (
    <>
      {/* Online Users Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          border: 'none',
          color: 'white',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.3s',
        }}
        title={`${onlineUsers.length} users online`}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
        }}
        title={`${onlineUsers.length} users online`}
      >
        👥
        {onlineUsers.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#10b981',
              color: 'white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              border: '2px solid white',
            }}
          >
            {onlineUsers.length}
          </span>
        )}
        {/* Connection indicator */}
        <span
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: presenceSocketRef.current?.connected ? '#10b981' : '#ef4444',
            border: '2px solid white',
          }}
          title={presenceSocketRef.current?.connected ? 'Connected' : 'Disconnected'}
        />
      </button>

      {/* Online Users Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 180,
            right: 24,
            width: 350,
            maxHeight: '70vh',
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Online Users ({onlineUsers.length})
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              ×
            </button>
          </div>

          {/* Users List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {onlineUsers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                <p>No other users online</p>
              </div>
            ) : (
              onlineUsers.map((onlineUser) => (
                <div
                  key={onlineUser.userId}
                  onClick={() => setSelectedUser(onlineUser)}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 16,
                      position: 'relative',
                    }}
                  >
                    {onlineUser.name.charAt(0).toUpperCase()}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '2px solid white',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                      {onlineUser.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{onlineUser.email}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>●</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            bottom: 180,
            right: 24,
            width: 400,
            height: 500,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 1002,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 16,
                  position: 'relative',
                }}
              >
                {selectedUser.name.charAt(0).toUpperCase()}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid white',
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>{selectedUser.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Online</div>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px', 
              background: '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
            }}
            ref={(el) => {
              if (el) {
                el.scrollTop = el.scrollHeight;
              }
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: 40, margin: 'auto' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <p style={{ margin: 0 }}>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMine = msg.fromUserId === user?.id;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const showTimestamp = !prevMsg || 
                  new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000; // 5 minutes
                
                return (
                  <div key={msg.id || index}>
                    {showTimestamp && (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#9ca3af', 
                        fontSize: 11, 
                        margin: '12px 0',
                        fontWeight: 500,
                      }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    <div
                      style={{
                        marginBottom: 8,
                        display: 'flex',
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end',
                        gap: 8,
                      }}
                    >
                      {!isMine && (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {msg.fromUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: 12,
                          background: isMine ? '#2563eb' : 'white',
                          color: isMine ? 'white' : '#111827',
                          fontSize: 14,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          border: isMine ? 'none' : '1px solid #e5e7eb',
                        }}
                      >
                        {!isMine && (
                          <div style={{ 
                            fontSize: 11, 
                            fontWeight: 600, 
                            marginBottom: 4,
                            color: isMine ? 'rgba(255,255,255,0.9)' : '#6b7280',
                          }}>
                            {msg.fromUser?.name || 'User'}
                          </div>
                        )}
                        <div>{msg.message}</div>
                        <div style={{ 
                          fontSize: 10, 
                          marginTop: 4,
                          opacity: 0.7,
                          textAlign: 'right',
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {isMine && (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              style={{
                padding: '10px 20px',
                background: message.trim() ? '#2563eb' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: message.trim() ? 'pointer' : 'not-allowed',
                fontSize: 14,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

