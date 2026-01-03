'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FavoriteButton from '../components/FavoriteButton';
import { useAuth } from '../contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type FavoriteItem = {
  id: string;
  artifactId: string;
  createdAt: string;
  artifact: {
    id: string;
    title: string;
    description: string;
    type: string;
    visibility: string;
    lab: {
      id: string;
      name: string;
      center: {
        id: string;
        name: string;
      } | null;
    };
  };
};

type FavoritesResponse = {
  favorites: FavoriteItem[];
};

export default function FavoritesPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!user || authLoading) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API}/favorites`, {
      credentials: 'include',
    })
      .then((r) => {
        if (!r.ok) {
          console.error('Favorites API error:', r.status, r.statusText);
          throw new Error(`API Error: ${r.status}`);
        }
        return r.json();
      })
      .then((data: FavoritesResponse) => {
        console.log('Favorites data:', data); // Debug log
        setFavorites(Array.isArray(data?.favorites) ? data.favorites : []);
      })
      .catch((error) => {
        console.error('Failed to load favorites:', error);
        setFavorites([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, isAuthenticated, authLoading, router]);

  const handleRemoveFavorite = (artifactId: string) => {
    setFavorites((prev) => prev.filter((f) => f.artifactId !== artifactId));
  };

  const refreshFavorites = () => {
    if (!user) {
      console.log('refreshFavorites: No user');
      return;
    }

    console.log('refreshFavorites: Fetching favorites for user:', user.id);
    fetch(`${API}/favorites`, {
      credentials: 'include',
    })
      .then((r) => {
        if (!r.ok) {
          console.error('Refresh favorites API error:', r.status);
          throw new Error(`API Error: ${r.status}`);
        }
        return r.json();
      })
      .then((data: FavoritesResponse) => {
        console.log('Refresh favorites data:', data);
        setFavorites(Array.isArray(data?.favorites) ? data.favorites : []);
      })
      .catch((error) => {
        console.error('Failed to refresh favorites:', error);
      });
  };

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
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>⭐ My Favorites</h1>
        <a
          href="/artifacts"
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
          ← Back to Artifacts
        </a>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', opacity: 0.7 }}>
          Loading favorites…
        </div>
      ) : favorites.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            opacity: 0.7,
            border: '1px dashed #ddd',
            borderRadius: 12,
            background: '#fafafa',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No favorites yet
          </div>
          <div style={{ fontSize: 14, marginBottom: 16 }}>
            Start exploring artifacts and add them to your favorites!
          </div>
          <a
            href="/artifacts"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: 'white',
              textDecoration: 'none',
              color: 'inherit',
              fontSize: 14,
            }}
          >
            Browse Artifacts
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {favorites.map((favorite) => {
            const a = favorite.artifact;
            return (
              <div
                key={favorite.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 12,
                  padding: 14,
                  background: 'white',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ fontWeight: 700, flex: 1 }}>{a.title}</div>

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
                        onToggle={(isFavorite) => {
                          if (!isFavorite) {
                            handleRemoveFavorite(a.id);
                          } else {
                            // Refresh favorites list when a favorite is added
                            refreshFavorites();
                          }
                        }}
                      />
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
                  Lab: {a.lab.name}
                  {a.lab.center ? ` • Center: ${a.lab.center.name}` : ''}
                </div>

                <div style={{ marginTop: 8, fontSize: 11, opacity: 0.6 }}>
                  Added {new Date(favorite.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

