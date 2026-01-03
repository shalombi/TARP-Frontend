'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import Loader from '../components/Loader';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  labMemberships: Array<{
    id: string;
    labId: string;
    roleInLab: string;
    lab: {
      id: string;
      name: string;
      center: {
        id: string;
        name: string;
      };
    };
  }>;
};

type Lab = {
  id: string;
  name: string;
  center: {
    id: string;
    name: string;
  };
};

type LabMember = {
  id: string;
  userId: string;
  labId: string;
  roleInLab: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

export default function AdminPage() {
  const { user, loading: authLoading, isAuthenticated, refreshToken } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [labMembers, setLabMembers] = useState<LabMember[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRoleInLab, setSelectedRoleInLab] = useState<string>('MEMBER');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (user && user.role === 'ADMIN') {
      loadData();
      loadSettings();
    }
  }, [authLoading, isAuthenticated, router, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load users
      const usersResponse = await fetch(`${API}/labs/users/all`, {
        credentials: 'include',
      });

      if (usersResponse.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return loadData();
        } else {
          router.push('/auth/login');
          return;
        }
      }

      if (!usersResponse.ok) {
        throw new Error('Failed to load users');
      }

      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Load labs
      const labsResponse = await fetch(`${API}/labs`, {
        credentials: 'include',
      });

      if (!labsResponse.ok) {
        throw new Error('Failed to load labs');
      }

      const labsData = await labsResponse.json();
      setLabs(labsData);

      if (labsData.length > 0 && !selectedLab) {
        setSelectedLab(labsData[0].id);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLab) {
      loadLabMembers(selectedLab);
    }
  }, [selectedLab]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API}/settings/presence:show-names`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setShowNames(data.showNames);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const toggleShowNames = async () => {
    setLoadingSettings(true);
    try {
      const response = await fetch(`${API}/settings/presence:show-names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ showNames: !showNames }),
      });
      if (response.ok) {
        const data = await response.json();
        setShowNames(data.showNames);
        setError(null);
      } else {
        throw new Error('Failed to update setting');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update setting');
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadLabMembers = async (labId: string) => {
    try {
      const response = await fetch(`${API}/labs/${labId}/members`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return loadLabMembers(labId);
        } else {
          router.push('/auth/login');
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Failed to load lab members');
      }

      const data = await response.json();
      setLabMembers(data);
    } catch (error: any) {
      console.error('Error loading lab members:', error);
      setError(error.message || 'Failed to load lab members');
    }
  };

  const handleAddUserToLab = async () => {
    if (!selectedLab || !selectedUserId) {
      setError('Please select both a lab and a user');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API}/labs/${selectedLab}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUserId,
          roleInLab: selectedRoleInLab,
        }),
      });

      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return handleAddUserToLab();
        } else {
          router.push('/auth/login');
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add user to lab' }));
        throw new Error(errorData.message || 'Failed to add user to lab');
      }

      // Reload data
      await loadLabMembers(selectedLab);
      await loadData();
      setShowAddUserModal(false);
      setSelectedUserId('');
      setSelectedRoleInLab('MEMBER');
    } catch (error: any) {
      console.error('Error adding user to lab:', error);
      setError(error.message || 'Failed to add user to lab');
    }
  };

  const handleRemoveUserFromLab = async (userId: string) => {
    if (!selectedLab) return;

    if (!confirm('Are you sure you want to remove this user from the lab?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API}/labs/${selectedLab}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return handleRemoveUserFromLab(userId);
        } else {
          router.push('/auth/login');
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to remove user from lab' }));
        throw new Error(errorData.message || 'Failed to remove user from lab');
      }

      // Reload data
      await loadLabMembers(selectedLab);
      await loadData();
    } catch (error: any) {
      console.error('Error removing user from lab:', error);
      setError(error.message || 'Failed to remove user from lab');
    }
  };

  if (authLoading || loading) {
    return <Loader fullScreen text="Loading admin panel..." />;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  const currentLab = labs.find((l) => l.id === selectedLab);
  const usersNotInLab = users.filter(
    (u) => !labMembers.some((m) => m.userId === u.id)
  );

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 800,
            marginBottom: 8,
            background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px',
          }}
        >
          Admin Panel
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>
          Manage users and lab memberships
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      )}

      {/* Privacy Settings */}
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(148, 163, 184, 0.2)',
          padding: 24,
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          Privacy Settings
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#111827' }}>
              Show User Names in Presence
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {showNames
                ? 'User names are visible to other users in the same lab'
                : 'User names are hidden - only "User" and ID are shown'}
            </div>
          </div>
          <button
            onClick={toggleShowNames}
            disabled={loadingSettings}
            style={{
              padding: '10px 24px',
              background: showNames ? '#10b981' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: loadingSettings ? 'not-allowed' : 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
              opacity: loadingSettings ? 0.6 : 1,
            }}
          >
            {loadingSettings ? 'Updating...' : showNames ? 'Hide Names' : 'Show Names'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Lab Selection and Members */}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.2)',
            padding: 24,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
            Lab Members
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: '#334155',
              }}
            >
              Select Lab
            </label>
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                background: 'white',
              }}
            >
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} ({lab.center.name})
                </option>
              ))}
            </select>
          </div>

          {currentLab && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                  <strong>{currentLab.name}</strong> - {currentLab.center.name}
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add User to Lab
                </button>
              </div>

              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                  Members ({labMembers.length})
                </h3>
                {labMembers.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                    No members in this lab
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {labMembers.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          padding: 16,
                          background: '#f8fafc',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {member.user.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {member.user.email} • {member.roleInLab}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveUserFromLab(member.userId)}
                          style={{
                            padding: '6px 12px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* All Users */}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.2)',
            padding: 24,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
            All Users ({users.length})
          </h2>

          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {users.map((u) => {
              const isInSelectedLab = labMembers.some((m) => m.userId === u.id);
              return (
                <div
                  key={u.id}
                  style={{
                    padding: 16,
                    background: isInSelectedLab ? '#f0fdf4' : '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {u.name}
                    {u.role === 'ADMIN' && (
                      <span
                        style={{
                          marginLeft: 8,
                          padding: '2px 8px',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                    {u.email}
                  </div>
                  {u.labMemberships.length > 0 && (
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      <strong>Labs:</strong>{' '}
                      {u.labMemberships.map((m) => m.lab.name).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddUserModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 32,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
              Add User to Lab
            </h2>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: '#334155',
                }}
              >
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  background: 'white',
                }}
              >
                <option value="">-- Select User --</option>
                {usersNotInLab.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: '#334155',
                }}
              >
                Role in Lab
              </label>
              <select
                value={selectedRoleInLab}
                onChange={(e) => setSelectedRoleInLab(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  background: 'white',
                }}
              >
                <option value="MEMBER">Member</option>
                <option value="LAB_ADMIN">Lab Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddUserModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUserToLab}
                disabled={!selectedUserId}
                style={{
                  padding: '10px 20px',
                  background: selectedUserId
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: selectedUserId ? 'pointer' : 'not-allowed',
                }}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

