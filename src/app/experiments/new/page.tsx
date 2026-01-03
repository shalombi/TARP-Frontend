'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Lab = {
  id: string;
  name: string;
  center?: {
    id: string;
    name: string;
  } | null;
};

export default function NewExperimentPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    labId: '',
    metadata: {
      status: 'planning',
      tags: [] as string[],
      parameters: {} as Record<string, any>,
    },
  });

  const [tagInput, setTagInput] = useState('');
  const [paramKey, setParamKey] = useState('');
  const [paramValue, setParamValue] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadLabs();
    }
  }, [authLoading, isAuthenticated, router, user]);

  const loadLabs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading labs...');
      
      const response = await fetch(`${API}/experiments/labs`, {
        credentials: 'include',
      });

      console.log('Labs response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load labs' }));
        console.error('Failed to load labs:', errorData);
        throw new Error(errorData.message || `Failed to load labs: ${response.status}`);
      }

      const data = await response.json();
      console.log('Loaded labs:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      setLabs(data);
      
      // Auto-select first lab if available
      if (data.length > 0 && !formData.labId) {
        setFormData((prev) => ({ ...prev, labId: data[0].id }));
      }
      
      if (data.length === 0) {
        setError('You are not a member of any labs. If you are an admin, you should see all labs. Otherwise, please contact an administrator to be added to a lab.');
      }
    } catch (error: any) {
      console.error('Error loading labs:', error);
      setError(error.message || 'Failed to load labs. Please make sure you are logged in and are a member of at least one lab.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.labId) {
        throw new Error('Lab is required');
      }

      console.log('Submitting experiment:', { 
        title: formData.title.trim(), 
        labId: formData.labId,
        hasMetadata: !!formData.metadata 
      });

      const response = await fetch(`${API}/experiments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          labId: formData.labId,
          metadata: formData.metadata,
        }),
      });

      console.log('Experiment creation response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create experiment' }));
        console.error('Experiment creation error:', errorData);
        throw new Error(errorData.message || `Failed to create experiment: ${response.status}`);
      }

      const experiment = await response.json();
      console.log('Experiment created successfully:', experiment);
      router.push(`/experiments`);
    } catch (error: any) {
      setError(error.message || 'Failed to create experiment');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.metadata.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          tags: [...prev.metadata.tags, tagInput.trim()],
        },
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata.tags.filter((t) => t !== tag),
      },
    }));
  };

  const addParameter = () => {
    if (paramKey.trim() && paramValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          parameters: {
            ...prev.metadata.parameters,
            [paramKey.trim()]: paramValue.trim(),
          },
        },
      }));
      setParamKey('');
      setParamValue('');
    }
  };

  const removeParameter = (key: string) => {
    setFormData((prev) => {
      const newParams = { ...prev.metadata.parameters };
      delete newParams[key];
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          parameters: newParams,
        },
      };
    });
  };

  if (authLoading || loading) {
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
    <div style={{ padding: '40px 48px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
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
          New Experiment
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>
          Create a new research experiment
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.2)',
            padding: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: '#1e293b',
              }}
            >
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Tokenizer Sweep – BPE sizes"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 15,
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            />
          </div>

          {/* Lab Selection */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: '#1e293b',
              }}
            >
              Lab *
            </label>
            {loading ? (
              <div style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>
                Loading labs...
              </div>
            ) : labs.length === 0 ? (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  color: '#92400e',
                  fontSize: 14,
                }}
              >
                No labs available. You need to be a member of at least one lab to create experiments.
              </div>
            ) : (
              <select
                value={formData.labId}
                onChange={(e) => setFormData((prev) => ({ ...prev, labId: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 15,
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <option value="">Select a lab...</option>
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                    {lab.center ? ` (${lab.center.name})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: '#1e293b',
              }}
            >
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your experiment, objectives, and methodology..."
              required
              rows={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 15,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            />
          </div>

          {/* Status */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: '#1e293b',
              }}
            >
              Status
            </label>
            <select
              value={formData.metadata.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: { ...prev.metadata, status: e.target.value },
                }))
              }
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 15,
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: '#1e293b',
              }}
            >
              Tags
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={addTag}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#1e293b',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
            {formData.metadata.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {formData.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#e0e7ff',
                      color: '#4338ca',
                      fontSize: 13,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4338ca',
                        cursor: 'pointer',
                        fontSize: 16,
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Parameters */}
          <div style={{ marginBottom: 32 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: '#1e293b',
              }}
            >
              Parameters (Key-Value pairs)
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={paramKey}
                onChange={(e) => setParamKey(e.target.value)}
                placeholder="Key"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="text"
                value={paramValue}
                onChange={(e) => setParamValue(e.target.value)}
                placeholder="Value"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={addParameter}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#1e293b',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
            {Object.keys(formData.metadata.parameters).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(formData.metadata.parameters).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      <strong>{key}:</strong> {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeParameter(key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: 18,
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#1e293b',
                fontSize: 15,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: submitting
                  ? '#cbd5e1'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Creating...' : 'Create Experiment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

