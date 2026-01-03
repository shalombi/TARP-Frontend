'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Link from 'next/link';

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
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
            }}
          >
            👋
          </div>
          <div>
            <h1
              style={{
                fontSize: 40,
                fontWeight: 800,
                marginBottom: 4,
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px',
              }}
            >
              Welcome back, {user?.name || 'Researcher'}!
            </h1>
            <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>
              Here's an overview of your research activities
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20,
          marginBottom: 32,
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
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
          Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
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
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
          Recent Activity
        </h2>
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            border: '1px solid #eee',
            padding: 24,
          }}
        >
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
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
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: 16,
        border: '1px solid rgba(148, 163, 184, 0.2)',
        padding: 28,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          opacity: 0.6,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10, fontWeight: 600, letterSpacing: '0.5px' }}>
            {title}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color, letterSpacing: '-1px' }}>{value}</div>
        </div>
        <div
          style={{
            fontSize: 48,
            opacity: 0.15,
            filter: 'grayscale(100%)',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.25';
            e.currentTarget.style.filter = 'grayscale(0%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.15';
            e.currentTarget.style.filter = 'grayscale(100%)';
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
        border: '1px solid rgba(148, 163, 184, 0.2)',
        padding: 24,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 32px ${color}20`;
        e.currentTarget.style.background = `linear-gradient(135deg, ${color}08 0%, white 100%)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        e.currentTarget.style.background = 'white';
      }}
    >
      <div
        style={{
          fontSize: 36,
          marginBottom: 16,
          transition: 'transform 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: '#1e293b' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{description}</div>
    </Link>
  );
}
