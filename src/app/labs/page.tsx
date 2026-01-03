'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Lab = {
  id: string;
  name: string;
  description: string;
  center?: {
    id: string;
    name: string;
  };
};

export default function LabsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetch(`${API}/labs`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        setLabs(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Failed to load labs:', error);
        setLabs([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || loading) {
    return <Loader fullScreen text="Loading labs..." />;
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
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
          Labs
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>Browse research laboratories</p>
      </div>

      {labs.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            border: '1px solid #eee',
            padding: 64,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧪</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No labs found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {labs.map((lab) => (
            <div
              key={lab.id}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: 16,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                padding: 28,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%)',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    fontSize: 40,
                    marginBottom: 16,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  }}
                >
                  🧪
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    marginBottom: 10,
                    color: '#1e293b',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {lab.name}
                </h3>
                {lab.description && (
                  <p style={{ fontSize: 15, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
                    {lab.description}
                  </p>
                )}
                {lab.center && (
                  <div
                    style={{
                      fontSize: 13,
                      color: '#94a3b8',
                      fontWeight: 500,
                      padding: '6px 12px',
                      background: 'rgba(148, 163, 184, 0.1)',
                      borderRadius: 8,
                      display: 'inline-block',
                    }}
                  >
                    Center: {lab.center.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

