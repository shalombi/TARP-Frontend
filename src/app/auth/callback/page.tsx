'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshToken } = useAuth();

  useEffect(() => {
    const success = searchParams.get('success');
    const token = searchParams.get('token');

    if (token) {
      // Magic link verification
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/auth/verify?token=${token}`, {
        credentials: 'include',
      })
        .then(() => {
          refreshToken().then(() => {
            router.push('/artifacts');
          });
        })
        .catch(() => {
          router.push('/auth/login?error=verification_failed');
        });
    } else if (success === 'true') {
      // OAuth callback
      refreshToken().then(() => {
        router.push('/artifacts');
      });
    } else {
      router.push('/auth/login?error=callback_failed');
    }
  }, [router, searchParams, refreshToken]);

  return (
    <main style={{ padding: 24, textAlign: 'center', marginTop: 100 }}>
      <div>Completing sign in...</div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}

