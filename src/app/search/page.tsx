'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type SearchResult = {
  id: string;
  title: string;
  description: string;
  score: number;
  reason?: string;
};

function SearchContent() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API}/search?q=${encodeURIComponent(query)}&limit=20`, {
        credentials: 'include',
      });
      const data = await response.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Loader fullScreen text="Loading search..." />;
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1200, margin: '0 auto' }}>
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
          Search
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>
          Semantic search across all artifacts
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for artifacts, experiments, or research..."
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 12,
              border: '1px solid #ddd',
              fontSize: 16,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 32px',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {loading ? (
        <Loader text="Searching artifacts..." />
      ) : results.length > 0 ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {results.map((result) => (
            <div
              key={result.id}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: 16,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                padding: 28,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>{result.title}</h3>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    background: '#dbeafe',
                    color: '#1e40af',
                  }}
                >
                  {Math.round(result.score * 100)}% match
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{result.description}</p>
              {result.reason && (
                <div style={{ fontSize: 13, color: '#999', fontStyle: 'italic' }}>
                  {result.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : query ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
          No results found for "{query}"
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
          Enter a search query to find artifacts
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}

