'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Artifacts', href: '/artifacts', icon: '🔬' },
  { name: 'Experiments', href: '/experiments', icon: '⚗️' },
  { name: 'Labs', href: '/labs', icon: '🧪' },
  { name: 'Favorites', href: '/favorites', icon: '⭐' },
  { name: 'Search', href: '/search', icon: '🔍' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
  { name: 'Admin', href: '/admin', icon: '⚙️' },
  { name: 'Profile', href: '/profile', icon: '👤' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div
      style={{
        width: 280,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '28px 24px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: 'white',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            T
          </div>
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.8px',
                lineHeight: 1.2,
              }}
            >
              TARP
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                marginTop: 2,
                letterSpacing: '0.3px',
                fontWeight: 500,
              }}
            >
              Technion Research Platform
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {user && (
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <NotificationsDropdown />
        </div>
      )}

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: '20px 16px',
          overflowY: 'auto',
        }}
      >
        {navigation.map((item) => {
          // Skip admin link if user is not admin
          if (item.href === '/admin' && user?.role !== 'ADMIN') {
            return null;
          }
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 10,
                marginBottom: 4,
                textDecoration: 'none',
                color: isActive ? '#2563eb' : '#4b5563',
                background: isActive ? '#eff6ff' : 'transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.color = '#111827';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#4b5563';
                }
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, letterSpacing: '-0.2px' }}>
                {item.name}
              </span>
              {item.badge && item.badge > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 10,
                    minWidth: 22,
                    textAlign: 'center',
                    lineHeight: 1.4,
                  }}
                >
                  {item.badge}
                </span>
              )}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    background: '#2563eb',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div
          style={{
            padding: '20px 16px',
            borderTop: '1px solid #f3f4f6',
            background: '#fafafa',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'white',
              marginBottom: 10,
              border: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}
            >
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 2,
                }}
              >
                {user.name || 'User'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: 'white',
              color: '#dc2626',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

