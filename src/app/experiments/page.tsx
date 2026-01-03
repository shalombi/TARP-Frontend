'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Experiment = {
  id: string;
  title: string;
  description: string;
  metadata: {
    status?: string;
    tags?: string[];
    parameters?: Record<string, any>;
  };
  createdAt: string;
  lab?: {
    id: string;
    name: string;
    center?: {
      id: string;
      name: string;
    } | null;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function ExperimentsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API}/experiments`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load experiments');
      }

      const data = await response.json();
      setExperiments(data);
    } catch (error: any) {
      console.error('Failed to load experiments:', error);
      setError(error.message || 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experiment?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`${API}/experiments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete experiment');
      }

      // Reload experiments
      await loadExperiments();
    } catch (error: any) {
      alert(error.message || 'Failed to delete experiment');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadExperiments();
  }, [authLoading, isAuthenticated, router, user]);

  if (authLoading || loading) {
    return <Loader fullScreen text="Loading experiments..." />;
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

      {error && (
        <div
          style={{
            padding: '16px',
            borderRadius: 8,
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {experiments.length === 0 && !loading ? (
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
                <div style={{ flex: 1 }}>
                  <Link
                    href={`/experiments/${exp.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: '#2563eb', cursor: 'pointer' }}>
                      {exp.title}
                    </h3>
                  </Link>
                  <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{exp.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                      background:
                        exp.metadata?.status === 'active'
                          ? '#d1fae5'
                          : exp.metadata?.status === 'completed'
                            ? '#dbeafe'
                            : exp.metadata?.status === 'paused'
                              ? '#fef3c7'
                              : '#f3f4f6',
                      color:
                        exp.metadata?.status === 'active'
                          ? '#065f46'
                          : exp.metadata?.status === 'completed'
                            ? '#1e40af'
                            : exp.metadata?.status === 'paused'
                              ? '#92400e'
                              : '#374151',
                    }}
                  >
                    {exp.metadata?.status || 'planning'}
                  </span>
                  {exp.createdBy?.id === user?.id && (
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingId === exp.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: deletingId === exp.id ? '#cbd5e1' : '#fee2e2',
                        color: deletingId === exp.id ? '#64748b' : '#991b1b',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: deletingId === exp.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {deletingId === exp.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
                {exp.lab && (
                  <>
                    Lab: {exp.lab.name}
                    {exp.lab.center && ` • Center: ${exp.lab.center.name}`}
                  </>
                )}
                {exp.createdBy && ` • Created by: ${exp.createdBy.name}`}
              </div>
              {exp.metadata?.tags && exp.metadata.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {exp.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: '#e0e7ff',
                        color: '#4338ca',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

