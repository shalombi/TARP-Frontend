'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(true); // Default to password login
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; magicLink?: string } | null>(null);
  const { login, loginWithPassword, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/artifacts');
    }

    const error = searchParams.get('error');
    const signupMessage = searchParams.get('message');
    
    if (error) {
      setMessage({ type: 'error', text: 'Authentication failed. Please try again.' });
    } else if (signupMessage === 'signup_success') {
      setMessage({ 
        type: 'success', 
        text: 'Account created! Please check your email for the magic link to sign in.' 
      });
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (usePassword && password) {
        // Login with username/email and password
        const result = await loginWithPassword(username, password);
        if (result.success) {
          // Redirect will happen automatically via AuthContext
          router.push('/artifacts');
        } else {
          setMessage({
            type: 'error',
            text: result.message || 'Invalid email or password',
          });
        }
      } else {
        // Login with magic link
        const result = await login(username);
        
        // If magic link is returned (development mode), show it
        if (result.success && result.magicLink) {
          setMessage({
            type: 'success',
            text: result.message,
            magicLink: result.magicLink, // Store link separately for button
          });
        } else {
          setMessage({
            type: result.success ? 'success' : 'error',
            text: result.message,
          });
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to authenticate. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

  return (
    <main style={{ padding: 24, maxWidth: 500, margin: '100px auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
        Sign in to TARP
      </h1>

      <div style={{ background: 'white', padding: 32, borderRadius: 12, border: '1px solid #eee' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setUsePassword(false)}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: `1px solid ${!usePassword ? '#0070f3' : '#ddd'}`,
              background: !usePassword ? '#0070f3' : 'white',
              color: !usePassword ? 'white' : '#333',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => setUsePassword(true)}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: `1px solid ${usePassword ? '#0070f3' : '#ddd'}`,
              background: usePassword ? '#0070f3' : 'white',
              color: usePassword ? 'white' : '#333',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Email & Password
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              {usePassword ? 'Username or Email' : 'Email address'}
            </label>
            <input
              type={usePassword ? 'text' : 'email'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder={usePassword ? 'username or email@example.com' : 'you@example.com'}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 16,
              }}
            />
          </div>

          {usePassword && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 16,
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: loading ? '#ccc' : '#0070f3',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? 'Signing in...'
              : usePassword
              ? 'Sign In'
              : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              whiteSpace: 'pre-line',
            }}
          >
            {message.text}
            {message.type === 'success' && message.magicLink && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a
                  href={message.magicLink}
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: '#0070f3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  🔗 Click to Sign In
                </a>
                <div style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-all' }}>
                  Or copy this link: {message.magicLink}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ opacity: 0.7, marginBottom: 12 }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" style={{ color: '#0070f3', textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee' }}>
          <p style={{ textAlign: 'center', marginBottom: 16, opacity: 0.7 }}>Or sign in with:</p>
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <a
              href={`${API}/auth/google`}
              style={{
                display: 'block',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #ddd',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
                background: 'white',
              }}
            >
              Continue with Google
            </a>
            <a
              href={`${API}/auth/microsoft`}
              style={{
                display: 'block',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #ddd',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
                background: 'white',
              }}
            >
              Continue with Microsoft
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

