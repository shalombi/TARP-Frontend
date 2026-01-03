'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (authLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 800,
            marginBottom: 8,
            background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px',
          }}
        >
          Profile
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>Manage your account settings</p>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 20,
          border: '1px solid rgba(148, 163, 184, 0.2)',
          padding: 40,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                border: '4px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{user.name || 'User'}</h2>
            <p style={{ fontSize: 14, color: '#666' }}>{user.email}</p>
            <p style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
              Role: {user.role || 'RESEARCHER'}
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Account Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 16,
                  background: editing ? 'white' : '#f9fafb',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 16,
                  background: '#f9fafb',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Role
              </label>
              <input
                type="text"
                value={user.role || 'RESEARCHER'}
                disabled
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 16,
                  background: '#f9fafb',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            {editing ? (
              <>
                <button
                  onClick={() => {
                    // TODO: Save changes
                    setEditing(false);
                  }}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setName(user?.name || '');
                    setEmail(user?.email || '');
                    setEditing(false);
                  }}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    background: 'white',
                    color: '#333',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  background: 'white',
                  color: '#333',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

