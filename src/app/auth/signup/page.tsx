'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/artifacts');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (usePassword && (!password || password.length < 6)) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          name, 
          ...(usePassword && password ? { password, username: username || undefined } : {})
        }),
      });

      const result = await response.json();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });

      if (result.success) {
        // Redirect to login page
        setTimeout(() => {
          router.push('/auth/login?message=signup_success');
        }, 1500);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to create account. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 500, margin: '100px auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
        Create Account
      </h1>

      <div style={{ background: 'white', padding: 32, borderRadius: 12, border: '1px solid #eee' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
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
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 16,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
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
            <>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Username (optional)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username (optional)"
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: 16,
                  }}
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  If not provided, you can login with your email
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={usePassword}
                  placeholder="Enter a password"
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: 16,
                  }}
                />
              </div>
            </>
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
            {loading ? 'Creating account...' : 'Create Account'}
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
            }}
          >
            {message.text}
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ opacity: 0.7, marginBottom: 12 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#0070f3', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee' }}>
          <p style={{ textAlign: 'center', marginBottom: 16, opacity: 0.7 }}>Or sign up with:</p>
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

