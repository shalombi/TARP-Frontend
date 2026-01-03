'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

type FavoriteButtonProps = {
  artifactId: string;
  userId: string;
  size?: 'small' | 'medium';
  onToggle?: (isFavorite: boolean) => void;
};

export default function FavoriteButton({
  artifactId,
  userId,
  size = 'medium',
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    fetch(`${API}/favorites/check/${artifactId}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        setIsFavorite(data.isFavorite || false);
      })
      .catch(() => {
        // Silent fail
      });
  }, [artifactId, userId]);

  const toggleFavorite = async () => {
    if (!userId || loading) return;

    setLoading(true);
    try {
      if (isFavorite) {
        await fetch(`${API}/favorites/${artifactId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        setIsFavorite(false);
        onToggle?.(false);
      } else {
        const response = await fetch(`${API}/favorites/${artifactId}`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!response.ok) {
          console.error('Failed to add favorite:', response.status, response.statusText);
          throw new Error('Failed to add favorite');
        }
        setIsFavorite(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  const iconSize = size === 'small' ? 16 : 20;
  const padding = size === 'small' ? '4px 8px' : '6px 12px';
  const fontSize = size === 'small' ? 12 : 14;

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding,
        borderRadius: 8,
        border: '1px solid #ddd',
        background: isFavorite ? '#fff3cd' : 'white',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        fontSize,
        transition: 'all 0.2s',
      }}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span style={{ fontSize: iconSize }}>
        {isFavorite ? '⭐' : '☆'}
      </span>
      {size === 'medium' && (
        <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
      )}
    </button>
  );
}

