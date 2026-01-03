'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Experiment = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  lab?: {
    id: string;
    name: string;
  };
};

export default function ExperimentsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    // TODO: Replace with actual API call
    setLoading(false);
  }, [authLoading, isAuthenticated, router, user]);

  if (authLoading || loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
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
            Experiments
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>
            Manage and track your research experiments
          </p>
        </div>
        <Link
          href="/experiments/new"
          style={{
            padding: '14px 28px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s',
            display: 'inline-block',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
        >
          + New Experiment
        </Link>
      </div>

      {experiments.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            border: '1px solid #eee',
            padding: 64,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚗️</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No experiments yet</div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
            Start by creating your first experiment
          </div>
          <Link
            href="/experiments/new"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Create Experiment
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {experiments.map((exp) => (
            <div
              key={exp.id}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #eee',
                padding: 24,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{exp.title}</h3>
                  <p style={{ fontSize: 14, color: '#666' }}>{exp.description}</p>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    background: exp.status === 'active' ? '#d1fae5' : '#f3f4f6',
                    color: exp.status === 'active' ? '#065f46' : '#374151',
                  }}
                >
                  {exp.status}
                </span>
              </div>
              {exp.lab && (
                <div style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
                  Lab: {exp.lab.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

