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
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        borderRight: '1px solid rgba(148, 163, 184, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '8px 0 32px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: 'white',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}
          >
            T
          </div>
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px',
              }}
            >
              TARP
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(148, 163, 184, 0.6)',
                marginTop: 2,
                letterSpacing: '0.5px',
                fontWeight: 500,
              }}
            >
              Research Platform
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {user && (
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          <NotificationsDropdown />
        </div>
      )}

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: '16px 12px',
          overflowY: 'auto',
        }}
      >
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                marginBottom: 6,
                textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(148, 163, 184, 0.8)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                  : 'transparent',
                border: isActive ? '1px solid rgba(102, 126, 234, 0.2)' : '1px solid transparent',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                backdropFilter: isActive ? 'blur(10px)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(148, 163, 184, 0.8)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}>
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
                    padding: '2px 8px',
                    borderRadius: 12,
                    minWidth: 20,
                    textAlign: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
              {isActive && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: '70%',
                      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '0 4px 4px 0',
                      boxShadow: '0 0 12px rgba(102, 126, 234, 0.6)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%)',
                      borderRadius: 12,
                      pointerEvents: 'none',
                    }}
                  />
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div
          style={{
            padding: '16px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'white',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name || 'User'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.5)',
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
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

