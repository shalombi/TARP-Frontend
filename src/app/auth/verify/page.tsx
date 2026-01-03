'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      router.push('/auth/login?error=no_token');
      return;
    }

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
  }, [router, searchParams, refreshToken]);

  return (
    <main style={{ padding: 24, textAlign: 'center', marginTop: 100 }}>
      <div>Verifying your email...</div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

