'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

export default function AnalyticsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return <Loader fullScreen text="Loading analytics..." />;
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
          Analytics
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>
          Research insights and statistics
        </p>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 20,
          border: '1px solid rgba(148, 163, 184, 0.2)',
          padding: 80,
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Analytics Coming Soon</div>
        <div style={{ fontSize: 14, color: '#666' }}>
          Advanced analytics and insights will be available here
        </div>
      </div>
    </div>
  );
}

