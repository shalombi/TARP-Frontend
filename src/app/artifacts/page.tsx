'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FavoriteButton from '../components/FavoriteButton';
import CommentsSection from '../components/CommentsSection';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

type ArtifactListItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  visibility: string;
  createdAt?: string;
  lab?: {
    id: string;
    name: string;
    center?: { id: string; name: string } | null;
  };
  _count?: {
    comments: number;
  };
};

type SearchResultItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  visibility: string;
  labId: string;
  centerId: string | null;
  labName: string;
  centerName: string | null;
  score: number;
  reason?: string | null;
  evidence?: {
    field: 'title' | 'description';
    snippet: string;
    snippetScore: number;
  } | null;
};

type SearchResponse = {
  query: string;
  results: SearchResultItem[];
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function ArtifactsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<(ArtifactListItem | SearchResultItem)[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'list' | 'semantic'>('list');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const url = useMemo(() => {
    const query = q.trim();

    if (query) {
      const u = new URL('/search', API);
      u.searchParams.set('q', query);
      u.searchParams.set('limit', '70');
      u.searchParams.set('explain', 'true');
      return { url: u.toString(), mode: 'semantic' as const };
    }

    return { url: new URL('/artifacts', API).toString(), mode: 'list' as const };
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMode(url.mode);

    console.log('Fetching artifacts:', { url: url.url, mode: url.mode });

    fetch(url.url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((r) => {
        if (!r.ok) {
          console.error('Fetch failed:', r.status, r.statusText);
          const errorText = r.text().catch(() => 'Unknown error');
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) {
          console.log('Request cancelled, ignoring response');
          return;
        }

        console.log('Artifacts data received:', { 
          mode: url.mode, 
          dataLength: Array.isArray(data) ? data.length : 'not array',
          isArray: Array.isArray(data),
          dataType: typeof data,
          data: data 
        });

        if (url.mode === 'semantic') {
          const res = data as SearchResponse;
          const results = Array.isArray(res?.results) ? res.results : [];
          console.log('Setting semantic results:', results.length);
          if (!cancelled) {
            setItems(results);
          }
        } else {
          const items = Array.isArray(data) ? data : [];
          console.log('Setting list items:', items.length);
          if (!cancelled) {
            setItems(items);
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Error fetching data:', error);
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  function relevanceLabel(score: number) {
    if (score >= 0.5) return 'Highly relevant';
    if (score >= 0.25) return 'Related';
    return 'Low relevance';
  }

  return (
    <main style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>TARP – Artifacts</h1>
        <a
          href="/favorites"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #ddd',
            background: 'white',
            textDecoration: 'none',
            color: 'inherit',
            fontSize: 14,
          }}
        >
          ⭐ My Favorites
        </a>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search… (e.g., tokenizer)"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: '1px solid #ddd',
          }}
        />
        <button
          onClick={() => setQ('')}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #ddd',
            background: 'white',
          }}
        >
          Clear
        </button>
      </div>

      {loading ? (
        <Loader text="Loading artifacts..." />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((a) => {
            const isSemantic = mode === 'semantic';
            const semanticItem = a as SearchResultItem;
            const score = isSemantic ? semanticItem.score : null;

            const labName = isSemantic
              ? semanticItem.labName
              : (a as ArtifactListItem).lab?.name;

            const centerName = isSemantic
              ? semanticItem.centerName
              : (a as ArtifactListItem).lab?.center?.name;

            const commentCount = (a as ArtifactListItem)._count?.comments || 0;
            const hasComments = commentCount > 0;
            
            return (
              <div
                key={a.id}
                style={{
                  border: selectedArtifactId === a.id 
                    ? '2px solid #667eea' 
                    : hasComments 
                    ? '1px solid rgba(102, 126, 234, 0.3)' 
                    : '1px solid #eee',
                  borderRadius: 12,
                  padding: 14,
                  background: selectedArtifactId === a.id 
                    ? '#f8fafc' 
                    : hasComments 
                    ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' 
                    : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onClick={() => setSelectedArtifactId(selectedArtifactId === a.id ? null : a.id)}
              >
                {hasComments && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#667eea',
                      boxShadow: '0 0 8px rgba(102, 126, 234, 0.6)',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ fontWeight: 700, flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.title}
                    {commentCount > 0 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.3)',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#667eea',
                        }}
                        title={`${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
                      >
                        💬 {commentCount}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 12,
                      opacity: 0.85,
                    }}
                  >
                    {user && (
                      <FavoriteButton
                        artifactId={a.id}
                        userId={user.id}
                        size="small"
                      />
                    )}
                    {isSemantic && score !== null && (
                      <span
                        style={{
                          border: '1px solid #ddd',
                          borderRadius: 999,
                          padding: '2px 8px',
                          background: 'white',
                        }}
                        title={`score=${score?.toFixed(4)}`}
                      >
                        Relevance: {relevanceLabel(score)}
                      </span>
                    )}
                    <span>
                      {a.type} • {a.visibility}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 8, opacity: 0.9 }}>
                  {a.description}
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                  Lab: {labName || '—'}
                  {centerName ? ` • Center: ${centerName}` : ''}
                </div>

                {isSemantic && semanticItem.evidence?.snippet && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #eee',
                      background: '#fafafa',
                      opacity: 0.9,
                    }}
                    title={`snippetScore=${semanticItem.evidence.snippetScore.toFixed(
                      4,
                    )}`}
                  >
                    <strong>Why this result:</strong>{' '}
                    “{semanticItem.evidence.snippet}”
                  </div>
                )}

                {isSemantic && semanticItem.reason ? (
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                    <strong>Why:</strong> {semanticItem.reason}
                  </div>
                ) : null}
              </div>
            );
          })}

          {items.length === 0 && (
            <div style={{ opacity: 0.7 }}>No results found.</div>
          )}
        </div>
      )}

      {/* Comments Section */}
      {selectedArtifactId && (
        <div style={{ marginTop: 32 }}>
          <CommentsSection artifactId={selectedArtifactId} />
        </div>
      )}
      
      {!selectedArtifactId && items.length > 0 && (
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.2)',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#1e293b' }}>
            Open Discussions
          </div>
          <div style={{ fontSize: 14 }}>
            Click on an artifact to view and add comments
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
            💡 Artifacts with comments are marked with a blue dot
          </div>
        </div>
      )}
    </main>
  );
}
