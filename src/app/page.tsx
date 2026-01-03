'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Link from 'next/link';
import Loader from './components/Loader';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return <Loader fullScreen text="Loading dashboard..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ padding: '48px 56px', maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: 48 }}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 8,
            color: '#111827',
            letterSpacing: '-1px',
            lineHeight: 1.2,
          }}
        >
          Welcome back, {user?.name || 'Researcher'}
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', fontWeight: 400 }}>
          Overview of your research activities and platform insights
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
          marginBottom: 48,
        }}
      >
        <StatCard
          title="Total Artifacts"
          value="0"
          icon="🔬"
          color="#667eea"
          href="/artifacts"
        />
        <StatCard
          title="Favorites"
          value="0"
          icon="⭐"
          color="#f59e0b"
          href="/favorites"
        />
        <StatCard
          title="Experiments"
          value="0"
          icon="⚗️"
          color="#10b981"
          href="/experiments"
        />
        <StatCard
          title="Active Labs"
          value="0"
          icon="🧪"
          color="#8b5cf6"
          href="/labs"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#111827', letterSpacing: '-0.3px' }}>
          Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
          }}
        >
          <QuickActionCard
            title="Search Artifacts"
            description="Find research artifacts"
            icon="🔍"
            href="/artifacts?mode=semantic"
            color="#3b82f6"
          />
          <QuickActionCard
            title="View Favorites"
            description="Your saved items"
            icon="⭐"
            href="/favorites"
            color="#f59e0b"
          />
          <QuickActionCard
            title="Create Experiment"
            description="Start new research"
            icon="⚗️"
            href="/experiments/new"
            color="#10b981"
          />
          <QuickActionCard
            title="Analytics"
            description="View insights"
            icon="📈"
            href="/analytics"
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#111827', letterSpacing: '-0.3px' }}>
          Recent Activity
        </h2>
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            padding: 32,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 14 }}>
            No recent activity
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        padding: 28,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, fontWeight: 500, letterSpacing: '0.2px', textTransform: 'uppercase' }}>
            {title}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
        </div>
        <div
          style={{
            fontSize: 40,
            opacity: 0.2,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.2';
          }}
        >
          {icon}
        </div>
      </div>
    </Link>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        padding: 24,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        e.currentTarget.style.background = '#fafafa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.background = 'white';
      }}
    >
      <div
        style={{
          fontSize: 32,
          marginBottom: 16,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#111827', letterSpacing: '-0.2px' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{description}</div>
    </Link>
  );
}
