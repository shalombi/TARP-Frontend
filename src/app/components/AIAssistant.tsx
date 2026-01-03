'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  artifacts?: Array<{ id: string; title: string; description: string | null }>;
};

export default function AIAssistant() {
  const { user, isAuthenticated, refreshToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || loading) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Add placeholder for assistant message (for streaming)
    const assistantMessageId = Date.now();
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      artifacts: undefined,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Helper function to make authenticated request
      const makeRequest = async (retry = true, useStreaming = true) => {
        const response = await fetch(`${API}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            message,
            conversationHistory,
            stream: useStreaming, // Try streaming first
          }),
        });

        // Handle 401 - try to refresh token and retry
        if (response.status === 401 && retry) {
          const refreshed = await refreshToken();
          if (refreshed) {
            // Retry once after refresh
            return makeRequest(false, useStreaming);
          } else {
            // Refresh failed, redirect to login
            window.location.href = '/auth/login?error=session_expired';
            throw new Error('Session expired. Please login again.');
          }
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Failed to get response: ${response.status} - ${errorText}`);
        }

        return response;
      };

      // Try streaming first, fallback to regular if it fails
      let response;
      try {
        response = await makeRequest(true, true);
      } catch (error: any) {
        console.warn('Streaming failed, trying regular request:', error);
        // Fallback to non-streaming
        response = await makeRequest(true, false);
      }

      // Check if response is streaming (text/event-stream) or regular JSON
      const contentType = response.headers.get('content-type') || '';
      console.log('Response content-type:', contentType);
      
      if (contentType.includes('text/event-stream')) {
        console.log('Handling streaming response');
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let artifacts: Array<{ id: string; title: string; description: string | null }> | undefined;
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.chunk) {
                    fullResponse += data.chunk;
                    // Update message in real-time
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMsg = newMessages[newMessages.length - 1];
                      if (lastMsg.role === 'assistant') {
                        lastMsg.content = fullResponse;
                      }
                      return newMessages;
                    });
                  }
                  if (data.artifacts) {
                    artifacts = data.artifacts;
                  }
                  if (data.done) {
                    // Final update with artifacts
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMsg = newMessages[newMessages.length - 1];
                      if (lastMsg.role === 'assistant') {
                        lastMsg.content = fullResponse || 'I apologize, but I could not generate a response.';
                        lastMsg.artifacts = artifacts;
                      }
                      return newMessages;
                    });
                    return; // Exit early when done
                  }
                  if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  // Skip invalid JSON
                  console.warn('Failed to parse SSE data:', line, e);
                }
              }
            }
          }
        }
      } else {
        // Handle regular JSON response (fallback)
        console.log('Handling regular JSON response');
        const data = await response.json();
        console.log('Response data:', data);
        const responseText = data.response || 'I apologize, but I could not generate a response.';
        
        if (!responseText || responseText.trim() === '') {
          console.error('Empty response received');
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = 'I apologize, but I received an empty response. Please try again.';
            }
            return newMessages;
          });
        } else {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = responseText;
              lastMsg.artifacts = data.artifacts;
            }
            return newMessages;
          });
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      // Update the last message with error
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.role === 'assistant') {
          const errorMsg = error?.message || 'I apologize, but I encountered an error. Please try again later.';
          // Only set error if message is still empty
          if (!lastMsg.content || lastMsg.content.trim() === '') {
            lastMsg.content = errorMsg;
          }
        }
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't show if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show message if user is not loaded yet
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            fontSize: 28,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            zIndex: 1000,
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
          }}
        >
          🤖
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 420,
            height: 600,
            borderRadius: 16,
            background: 'white',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 24 }}>🤖</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>AI Research Assistant</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Ask me anything about artifacts</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                width: 32,
                height: 32,
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
              padding: '20px',
              background: '#f8fafc',
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#64748b',
                  padding: '40px 20px',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  Welcome to AI Assistant!
                </div>
                <div style={{ fontSize: 14 }}>
                  Ask me about artifacts, research, or anything related to the platform.
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: 16,
                      background: msg.role === 'user' 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'white',
                      color: msg.role === 'user' ? 'white' : '#1e293b',
                      boxShadow: msg.role === 'user' 
                        ? '0 2px 8px rgba(102, 126, 234, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.artifacts && msg.artifacts.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        maxWidth: '80%',
                        fontSize: 12,
                        color: '#64748b',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>📚 Relevant artifacts:</div>
                      {msg.artifacts.slice(0, 3).map((art) => (
                        <a
                          key={art.id}
                          href={`/artifacts?highlight=${art.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/artifacts?highlight=${art.id}`;
                          }}
                          style={{
                            display: 'block',
                            padding: '8px 12px',
                            marginBottom: 4,
                            background: '#f1f5f9',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e2e8f0';
                            e.currentTarget.style.borderColor = '#667eea';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>
                            {art.title}
                          </div>
                          {art.description && (
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                              {art.description.slice(0, 100)}...
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                <div style={{ fontSize: 20 }}>🤖</div>
                <div>Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '16px',
              background: 'white',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: loading || !input.trim()
                    ? '#cbd5e1'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

