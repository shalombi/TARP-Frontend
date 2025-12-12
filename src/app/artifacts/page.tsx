'use client';

import { useEffect, useMemo, useState } from 'react';

type ArtifactListItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  visibility: string;
  createdAt?: string;
  lab?: { id: string; name: string; center?: { id: string; name: string } | null };
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
};

type SearchResponse = {
  query: string;
  results: SearchResultItem[];
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL!

export default function ArtifactsPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<(ArtifactListItem | SearchResultItem)[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'list' | 'semantic'>('list');

  const url = useMemo(() => {
    const query = q.trim();

    if (query) {
      setMode('semantic');
      const u = new URL('/search', API);
      u.searchParams.set('q', query);
      u.searchParams.set('limit', '20');
      // u.searchParams.set('centerId', '...');
      // u.searchParams.set('labId', '...');
      return u.toString();
    }

    setMode('list');
    return new URL('/artifacts', API).toString();
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    console.log('url',url)

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;

        if (mode === 'semantic') {
          const res = data as SearchResponse;
          setItems(Array.isArray(res?.results) ? res.results : []);
        } else {
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, mode])

  function relevanceLabel(score: number) {
    if (score >= 0.5) return 'Highly relevant';
    if (score >= 0.25) return 'Related';
    return null;
  }
  
  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>TARP – Artifacts</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search… (e.g., tokenizer)"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <button
          onClick={() => setQ('')}
          style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', background: 'white' }}
        >
          Clear
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((a) => {
            const isSemantic = mode === 'semantic';
            const score = isSemantic ? (a as SearchResultItem).score : null;

            const labName = isSemantic ? (a as SearchResultItem).labName : (a as ArtifactListItem).lab?.name;
            const centerName = isSemantic
              ? (a as SearchResultItem).centerName
              : (a as ArtifactListItem).lab?.center?.name;

            return (
              <div
                key={a.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 12,
                  padding: 14,
                  background: 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>{a.title}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, opacity: 0.85 }}>
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

                <div style={{ marginTop: 8, opacity: 0.9 }}>{a.description}</div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                  Lab: {labName || '—'} {centerName ? `• Center: ${centerName}` : ''}
                </div>
                {score && (
  <span className="badge">
    {relevanceLabel(score)}
  </span>
)}
              </div>
            );
          })}

          {items.length === 0 && <div style={{ opacity: 0.7 }}>No results found.</div>}
        </div>
      )}
    </main>
  );
}
