'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../../components/Loader';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type ExperimentRun = {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELED';
  startedAt: string | null;
  finishedAt: string | null;
  gitCommitSha: string | null;
  branch: string | null;
  paramsJson: Record<string, any> | null;
  metricsJson: Record<string, any> | null;
  logs: string | null;
  logsUrl: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  datasetArtifact: {
    id: string;
    title: string;
    type: string;
  } | null;
  modelArtifact: {
    id: string;
    title: string;
    type: string;
  } | null;
  inputArtifacts: Array<{
    artifact: {
      id: string;
      title: string;
      type: string;
    };
  }>;
  outputArtifacts: Array<{
    artifact: {
      id: string;
      title: string;
      type: string;
    };
  }>;
};

type Experiment = {
  id: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  lab: {
    id: string;
    name: string;
    center?: {
      id: string;
      name: string;
    } | null;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
};

type LineageGraph = {
  experiment: {
    id: string;
    title: string;
    description: string;
  };
  graph: {
    nodes: Array<{
      id: string;
      type: 'experiment' | 'run' | 'artifact';
      label: string;
      data: Record<string, any>;
    }>;
    edges: Array<{
      from: string;
      to: string;
      type: string;
    }>;
  };
};

export default function ExperimentDetailPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const experimentId = params?.id as string;

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [lineage, setLineage] = useState<LineageGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [runsLoading, setRunsLoading] = useState(false);
  const [lineageLoading, setLineageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRun, setShowCreateRun] = useState(false);
  const [showUpdateRun, setShowUpdateRun] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'runs' | 'lineage'>('runs');

  const loadExperiment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API}/experiments/${experimentId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load experiment');
      }

      const data = await response.json();
      setExperiment(data);
    } catch (error: any) {
      console.error('Failed to load experiment:', error);
      setError(error.message || 'Failed to load experiment');
    } finally {
      setLoading(false);
    }
  };

  const loadRuns = async () => {
    try {
      setRunsLoading(true);
      const response = await fetch(`${API}/experiments/${experimentId}/runs?page=1&limit=50`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load runs:', response.status, errorText);
        throw new Error(`Failed to load runs: ${response.status}`);
      }

      const data = await response.json();
      console.log('Runs API response:', data);
      console.log('Response type:', Array.isArray(data) ? 'array' : typeof data);
      console.log('Has data property:', !!data.data);
      console.log('Data.data type:', data.data ? (Array.isArray(data.data) ? 'array' : typeof data.data) : 'null');
      
      // Handle both paginated response { data: [...], pagination: {...} } and array response
      let runsArray: ExperimentRun[] = [];
      if (Array.isArray(data)) {
        runsArray = data;
        console.log('Using array response, found', runsArray.length, 'runs');
      } else if (data.data && Array.isArray(data.data)) {
        runsArray = data.data;
        console.log('Using paginated response, found', runsArray.length, 'runs out of', data.pagination?.total || 'unknown', 'total');
      } else if (data.pagination && data.pagination.total === 0) {
        // Empty paginated response
        runsArray = [];
        console.log('Empty paginated response');
      } else {
        console.warn('Unexpected runs response format:', data);
        console.warn('Trying to extract runs from response...');
        // Try to find runs in the response
        if (data.runs && Array.isArray(data.runs)) {
          runsArray = data.runs;
        } else {
          runsArray = [];
        }
      }
      console.log('Setting runs:', runsArray.length, 'runs');
      if (runsArray.length > 0) {
        console.log('First run:', runsArray[0]);
      }
      setRuns(runsArray);
    } catch (error: any) {
      console.error('Failed to load runs:', error);
      setRuns([]);
    } finally {
      setRunsLoading(false);
    }
  };

  const loadLineage = async () => {
    try {
      setLineageLoading(true);
      const response = await fetch(`${API}/experiments/${experimentId}/lineage`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load lineage');
      }

      const data = await response.json();
      setLineage(data);
    } catch (error: any) {
      console.error('Failed to load lineage:', error);
    } finally {
      setLineageLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!user || !experimentId) {
      setLoading(false);
      return;
    }

    loadExperiment();
    loadRuns();
  }, [authLoading, isAuthenticated, router, user, experimentId]);

  // Reload runs when tab changes to runs
  useEffect(() => {
    if (activeTab === 'runs' && !runsLoading && runs.length === 0 && experimentId) {
      console.log('Reloading runs because tab is active and no runs loaded');
      loadRuns();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'lineage' && !lineage) {
      loadLineage();
    }
  }, [activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#10b981';
      case 'RUNNING':
        return '#3b82f6';
      case 'FAILED':
        return '#ef4444';
      case 'CANCELED':
        return '#6b7280';
      case 'QUEUED':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#d1fae5';
      case 'RUNNING':
        return '#dbeafe';
      case 'FAILED':
        return '#fee2e2';
      case 'CANCELED':
        return '#f3f4f6';
      case 'QUEUED':
        return '#fef3c7';
      default:
        return '#f3f4f6';
    }
  };

  if (authLoading || loading) {
    return <Loader fullScreen text="Loading experiment..." />;
  }

  if (error || !experiment) {
    return (
      <div style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: 24 }}>
          <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error</h2>
          <p style={{ color: '#991b1b' }}>{error || 'Experiment not found'}</p>
          <Link href="/experiments" style={{ color: '#2563eb', textDecoration: 'underline', marginTop: 16, display: 'inline-block' }}>
            ← Back to Experiments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/experiments"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#6b7280',
            textDecoration: 'none',
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          ← Back to Experiments
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, color: '#111827' }}>
          {experiment.title}
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 16 }}>{experiment.description}</p>
        <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#6b7280' }}>
          <span>Lab: {experiment.lab.name}</span>
          {experiment.lab.center && <span>• Center: {experiment.lab.center.name}</span>}
          <span>• Created by: {experiment.createdBy.name}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('runs')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'runs' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'runs' ? 600 : 400,
            borderBottom: activeTab === 'runs' ? '2px solid #2563eb' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>Runs</span>
          {runsLoading ? (
            <span style={{ fontSize: 12, opacity: 0.6 }}>...</span>
          ) : (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                background: activeTab === 'runs' ? '#2563eb' : '#e5e7eb',
                color: activeTab === 'runs' ? 'white' : '#6b7280',
                minWidth: 24,
                textAlign: 'center',
              }}
            >
              {runs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('lineage')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'lineage' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'lineage' ? 600 : 400,
            borderBottom: activeTab === 'lineage' ? '2px solid #2563eb' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>Lineage</span>
          {lineage && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                background: activeTab === 'lineage' ? '#2563eb' : '#e5e7eb',
                color: activeTab === 'lineage' ? 'white' : '#6b7280',
                minWidth: 24,
                textAlign: 'center',
              }}
            >
              {lineage.graph.nodes.length}
            </span>
          )}
        </button>
      </div>

      {/* Runs Tab */}
      {activeTab === 'runs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Experiment Runs</h2>
            <button
              onClick={() => setShowCreateRun(true)}
              style={{
                padding: '10px 20px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              + Create Run
            </button>
          </div>

          {runsLoading ? (
            <Loader text="Loading runs..." />
          ) : runs.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚗️</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111827' }}>No runs yet</h3>
              <p style={{ color: '#6b7280', marginBottom: 24 }}>Create your first experiment run to track execution and results.</p>
              <button
                onClick={() => setShowCreateRun(true)}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Create First Run
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {runs.map((run) => (
                <div
                  key={run.id}
                  style={{
                    background: selectedRun === run.id 
                      ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' 
                      : 'white',
                    borderRadius: 16,
                    border: selectedRun === run.id 
                      ? '2px solid #2563eb' 
                      : '1px solid #e5e7eb',
                    padding: 20,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    boxShadow: selectedRun === run.id 
                      ? '0 4px 16px rgba(37, 99, 235, 0.15)' 
                      : '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRun !== run.id) {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRun !== run.id) {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                  onClick={() => setSelectedRun(selectedRun === run.id ? null : run.id)}
                >
                  <div style={{ marginBottom: 16 }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '6px 14px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              background: getStatusBg(run.status),
                              color: getStatusColor(run.status),
                              border: `2px solid ${getStatusColor(run.status)}`,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {run.status}
                          </span>
                          <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                            Run ID: <span style={{ fontFamily: 'monospace', color: '#1e293b' }}>{run.id.slice(0, 8)}</span>
                          </span>
                        </div>

                        {/* Git Info Row */}
                        {(run.gitCommitSha || run.branch) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                            {run.gitCommitSha && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14 }}>🔀</span>
                                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Commit:</span>
                                <span style={{ 
                                  fontSize: 12, 
                                  fontFamily: 'monospace', 
                                  color: '#1e293b',
                                  background: '#f1f5f9',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontWeight: 600,
                                }}>
                                  {run.gitCommitSha.slice(0, 7)}
                                </span>
                              </div>
                            )}
                            {run.branch && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14 }}>🌿</span>
                                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Branch:</span>
                                <span style={{ 
                                  fontSize: 12, 
                                  color: '#1e293b',
                                  background: '#f1f5f9',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontWeight: 600,
                                }}>
                                  {run.branch}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metadata Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>👤</span>
                            <span>{run.createdBy.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>📅</span>
                            <span>Created: {new Date(run.createdAt).toLocaleString()}</span>
                          </div>
                          {run.startedAt && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>▶️</span>
                              <span>Started: {new Date(run.startedAt).toLocaleString()}</span>
                            </div>
                          )}
                          {run.finishedAt && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>✅</span>
                              <span>Finished: {new Date(run.finishedAt).toLocaleString()}</span>
                            </div>
                          )}
                          {run.startedAt && run.finishedAt && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>⏱️</span>
                              <span>
                                Duration: {Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000 / 60)} min
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div style={{ 
                      display: 'flex', 
                      gap: 12, 
                      marginTop: 12,
                      padding: '12px 16px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}>
                      {run.paramsJson && Object.keys(run.paramsJson).length > 0 && (
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          <strong style={{ color: '#1e293b' }}>Parameters:</strong> {Object.keys(run.paramsJson).length} keys
                        </div>
                      )}
                      {run.metricsJson && Object.keys(run.metricsJson).length > 0 && (
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          <strong style={{ color: '#1e293b' }}>Metrics:</strong> {Object.keys(run.metricsJson).length} values
                        </div>
                      )}
                      {(run.inputArtifacts.length > 0 || run.outputArtifacts.length > 0) && (
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          <strong style={{ color: '#1e293b' }}>Artifacts:</strong> {run.inputArtifacts.length} in, {run.outputArtifacts.length} out
                        </div>
                      )}
                      {run.logs && (
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          <strong style={{ color: '#1e293b' }}>Logs:</strong> {run.logs.length} chars
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRun === run.id && (
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '2px solid #e5e7eb' }}>
                      {/* Parameters */}
                      {run.paramsJson && Object.keys(run.paramsJson).length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>⚙️</span>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Parameters</h4>
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
                              {Object.keys(run.paramsJson).length} parameters
                            </span>
                          </div>
                          <div style={{ 
                            background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)', 
                            borderRadius: 10, 
                            padding: 16, 
                            fontSize: 13, 
                            fontFamily: 'monospace',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                              {JSON.stringify(run.paramsJson, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Metrics */}
                      {run.metricsJson && Object.keys(run.metricsJson).length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>📊</span>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Results & Metrics</h4>
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
                              {Object.keys(run.metricsJson).length} metrics
                            </span>
                          </div>
                          <div style={{ 
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                            borderRadius: 10, 
                            padding: 16, 
                            fontSize: 13, 
                            fontFamily: 'monospace',
                            border: '2px solid #10b981',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                          }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#065f46', fontWeight: 500 }}>
                              {JSON.stringify(run.metricsJson, null, 2)}
                            </pre>
                          </div>
                          {/* Key Metrics Display */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                            gap: 12, 
                            marginTop: 16 
                          }}>
                            {Object.entries(run.metricsJson).map(([key, value]) => (
                              <div
                                key={key}
                                style={{
                                  padding: '12px 16px',
                                  background: 'white',
                                  borderRadius: 8,
                                  border: '1px solid #d1fae5',
                                  textAlign: 'center',
                                }}
                              >
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  {key}
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
                                  {typeof value === 'number' ? value.toFixed(4) : String(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Artifacts */}
                      {(run.datasetArtifact || run.inputArtifacts.length > 0 || run.outputArtifacts.length > 0) && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>📦</span>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Artifacts</h4>
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
                              {[run.datasetArtifact, ...run.inputArtifacts.map(ia => ia.artifact), ...run.outputArtifacts.map(oa => oa.artifact)].filter(Boolean).length} total
                            </span>
                          </div>
                          
                          {run.datasetArtifact && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                📊 Dataset
                              </div>
                              <Link 
                                href={`/artifacts?highlight=${run.datasetArtifact.id}`} 
                                style={{ 
                                  display: 'block',
                                  padding: '12px 16px',
                                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                  borderRadius: 8,
                                  border: '1px solid #3b82f6',
                                  textDecoration: 'none',
                                  color: '#1e40af',
                                  fontWeight: 600,
                                  fontSize: 14,
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateX(4px)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateX(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                {run.datasetArtifact.title}
                                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
                                  ({run.datasetArtifact.type})
                                </span>
                              </Link>
                            </div>
                          )}
                          
                          {run.inputArtifacts.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                📥 Input Artifacts ({run.inputArtifacts.length})
                              </div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                {run.inputArtifacts.map((ia) => (
                                  <Link
                                    key={ia.artifact.id}
                                    href={`/artifacts?highlight=${ia.artifact.id}`}
                                    style={{
                                      display: 'block',
                                      padding: '10px 14px',
                                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                      borderRadius: 8,
                                      border: '1px solid #10b981',
                                      textDecoration: 'none',
                                      color: '#065f46',
                                      fontWeight: 500,
                                      fontSize: 13,
                                      transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'translateX(4px)';
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'translateX(0)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    {ia.artifact.title}
                                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
                                      ({ia.artifact.type})
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {run.outputArtifacts.length > 0 && (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                📤 Output Artifacts ({run.outputArtifacts.length})
                              </div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                {run.outputArtifacts.map((oa) => (
                                  <Link
                                    key={oa.artifact.id}
                                    href={`/artifacts?highlight=${oa.artifact.id}`}
                                    style={{
                                      display: 'block',
                                      padding: '10px 14px',
                                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                      borderRadius: 8,
                                      border: '1px solid #f59e0b',
                                      textDecoration: 'none',
                                      color: '#92400e',
                                      fontWeight: 500,
                                      fontSize: 13,
                                      transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'translateX(4px)';
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'translateX(0)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    {oa.artifact.title}
                                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
                                      ({oa.artifact.type})
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Logs */}
                      {run.logs && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>📝</span>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Execution Logs</h4>
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
                              {run.logs.length} characters
                            </span>
                          </div>
                          <div style={{ 
                            background: '#1e293b', 
                            color: '#e2e8f0', 
                            borderRadius: 10, 
                            padding: 16, 
                            fontSize: 12, 
                            fontFamily: 'monospace', 
                            maxHeight: 300, 
                            overflow: 'auto',
                            border: '2px solid #0f172a',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                          }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{run.logs}</pre>
                          </div>
                          {run.logsUrl && (
                            <div style={{ marginTop: 12 }}>
                              <a 
                                href={run.logsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  color: '#2563eb', 
                                  fontSize: 13,
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  padding: '6px 12px',
                                  background: '#eff6ff',
                                  borderRadius: 6,
                                  border: '1px solid #3b82f6',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#dbeafe';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#eff6ff';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <span>🔗</span>
                                <span>View full logs →</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty state for results */}
                      {!run.metricsJson && !run.logs && run.outputArtifacts.length === 0 && (
                        <div style={{ marginTop: 16, padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #fbbf24' }}>
                          <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600, marginBottom: 8 }}>
                            ⚠️ No results yet
                          </div>
                          <div style={{ fontSize: 12, color: '#78350f', marginBottom: 12 }}>
                            This run doesn't have results yet. Update it with metrics, logs, or output artifacts.
                          </div>
                          <button
                            onClick={() => setShowUpdateRun(run.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Add Results
                          </button>
                        </div>
                      )}

                      {/* Update button */}
                      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setShowUpdateRun(run.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Update Run
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Update Run Modal */}
      {showUpdateRun && (
        <UpdateRunModal
          runId={showUpdateRun}
          experimentId={experimentId}
          onClose={() => {
            setShowUpdateRun(null);
            loadRuns();
          }}
        />
      )}

      {/* Lineage Tab */}
      {activeTab === 'lineage' && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#111827' }}>Lineage Graph</h2>
          {lineageLoading ? (
            <Loader text="Loading lineage..." />
          ) : lineage ? (
            <div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>Graph Statistics</h3>
                  <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Nodes:</span>{' '}
                      <strong style={{ color: '#111827' }}>{lineage.graph.nodes.length}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Edges:</span>{' '}
                      <strong style={{ color: '#111827' }}>{lineage.graph.edges.length}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>Nodes ({lineage.graph.nodes.length})</h3>
                  <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {lineage.graph.nodes.map((node) => (
                      <div
                        key={node.id}
                        style={{
                          padding: 16,
                          background: node.type === 'experiment' 
                            ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' 
                            : node.type === 'run' 
                            ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
                            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          borderRadius: 12,
                          border: `2px solid ${node.type === 'experiment' ? '#3b82f6' : node.type === 'run' ? '#10b981' : '#f59e0b'}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                        onClick={() => {
                          if (node.type === 'run') {
                            setSelectedRun(node.id);
                            setActiveTab('runs');
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: 11, 
                              color: node.type === 'experiment' ? '#1e40af' : node.type === 'run' ? '#065f46' : '#92400e',
                              fontWeight: 700,
                              marginBottom: 6,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {node.type === 'experiment' ? '🔬' : node.type === 'run' ? '⚗️' : '📦'} {node.type}
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
                              {node.label}
                            </div>
                          </div>
                        </div>
                        {node.data && Object.keys(node.data).length > 0 && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
                              ID: {node.id.slice(0, 8)}...
                            </div>
                            {node.data.status && (
                              <div style={{ 
                                marginTop: 6,
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                background: node.data.status === 'SUCCESS' ? '#d1fae5' : 
                                          node.data.status === 'RUNNING' ? '#dbeafe' : 
                                          node.data.status === 'FAILED' ? '#fee2e2' : '#fef3c7',
                                color: node.data.status === 'SUCCESS' ? '#065f46' : 
                                       node.data.status === 'RUNNING' ? '#1e40af' : 
                                       node.data.status === 'FAILED' ? '#991b1b' : '#92400e',
                              }}>
                                {node.data.status}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>Relationships ({lineage.graph.edges.length})</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {lineage.graph.edges.map((edge, idx) => {
                      const fromNode = lineage.graph.nodes.find((n) => n.id === edge.from);
                      const toNode = lineage.graph.nodes.find((n) => n.id === edge.to);
                      const edgeTypeColors: Record<string, string> = {
                        'has_run': '#3b82f6',
                        'uses': '#10b981',
                        'used_by': '#10b981',
                        'produces': '#f59e0b',
                        'produced': '#f59e0b',
                      };
                      const edgeColor = edgeTypeColors[edge.type] || '#6b7280';
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: 14,
                            background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                            borderRadius: 10,
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = edgeColor;
                            e.currentTarget.style.boxShadow = `0 2px 8px ${edgeColor}30`;
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                          onClick={() => {
                            if (toNode?.type === 'run') {
                              setSelectedRun(edge.to);
                              setActiveTab('runs');
                            }
                          }}
                        >
                          <div style={{ 
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: fromNode?.type === 'experiment' ? '#eff6ff' : fromNode?.type === 'run' ? '#f0fdf4' : '#fef3c7',
                            border: `1px solid ${fromNode?.type === 'experiment' ? '#3b82f6' : fromNode?.type === 'run' ? '#10b981' : '#f59e0b'}`,
                            fontWeight: 600,
                            color: '#111827',
                            fontSize: 13,
                            minWidth: 120,
                            textAlign: 'center',
                          }}>
                            {fromNode?.label || edge.from.slice(0, 8)}
                          </div>
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flex: 1,
                          }}>
                            <div style={{ 
                              fontSize: 20,
                              color: edgeColor,
                              fontWeight: 700,
                            }}>→</div>
                            <span style={{ 
                              fontSize: 11, 
                              color: '#ffffff',
                              background: edgeColor,
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              {edge.type.replace('_', ' ')}
                            </span>
                            <div style={{ 
                              fontSize: 20,
                              color: edgeColor,
                              fontWeight: 700,
                            }}>→</div>
                          </div>
                          <div style={{ 
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: toNode?.type === 'experiment' ? '#eff6ff' : toNode?.type === 'run' ? '#f0fdf4' : '#fef3c7',
                            border: `1px solid ${toNode?.type === 'experiment' ? '#3b82f6' : toNode?.type === 'run' ? '#10b981' : '#f59e0b'}`,
                            fontWeight: 600,
                            color: '#111827',
                            fontSize: 13,
                            minWidth: 120,
                            textAlign: 'center',
                          }}>
                            {toNode?.label || edge.to.slice(0, 8)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111827' }}>No lineage data</h3>
              <p style={{ color: '#6b7280' }}>Create experiment runs to see lineage relationships.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Run Modal */}
      {showCreateRun && (
        <CreateRunModal
          experimentId={experimentId}
          onClose={async () => {
            setShowCreateRun(false);
            // Wait a bit for backend to process, then reload
            await new Promise(resolve => setTimeout(resolve, 300));
            await loadRuns();
            // Also reload lineage if we're on that tab
            if (activeTab === 'lineage') {
              await loadLineage();
            }
          }}
        />
      )}
    </div>
  );
}

// Update Run Modal Component
function UpdateRunModal({
  runId,
  experimentId,
  onClose,
}: {
  runId: string;
  experimentId: string;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    status: 'SUCCESS' as const,
    metricsJson: '',
    logs: '',
    logsUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let metricsJson = {};
      if (formData.metricsJson.trim()) {
        metricsJson = JSON.parse(formData.metricsJson);
      }

      const response = await fetch(`${API}/experiment-runs/${runId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: formData.status,
          metricsJson: Object.keys(metricsJson).length > 0 ? metricsJson : undefined,
          logs: formData.logs || undefined,
          logsUrl: formData.logsUrl || undefined,
          finishedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update run' }));
        throw new Error(errorData.message || 'Failed to update run');
      }

      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to update run');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 32,
          maxWidth: 700,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#111827' }}>Update Experiment Run</h2>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 24, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            >
              <option value="QUEUED">QUEUED</option>
              <option value="RUNNING">RUNNING</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
              Metrics JSON (e.g., accuracy, loss, f1_score)
            </label>
            <textarea
              value={formData.metricsJson}
              onChange={(e) => setFormData({ ...formData, metricsJson: e.target.value })}
              placeholder='{"accuracy": 0.95, "loss": 0.05, "f1_score": 0.92}'
              rows={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              Enter metrics as JSON. Example: accuracy, loss, precision, recall, f1_score, etc.
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
              Logs
            </label>
            <textarea
              value={formData.logs}
              onChange={(e) => setFormData({ ...formData, logs: e.target.value })}
              placeholder="Training completed successfully. Final accuracy: 0.95"
              rows={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
              Logs URL (optional)
            </label>
            <input
              type="text"
              value={formData.logsUrl}
              onChange={(e) => setFormData({ ...formData, logsUrl: e.target.value })}
              placeholder="https://example.com/logs/run-123"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 20px',
                background: submitting ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              {submitting ? 'Updating...' : 'Update Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Run Modal Component
function CreateRunModal({
  experimentId,
  onClose,
}: {
  experimentId: string;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    status: 'QUEUED' as const,
    gitCommitSha: '',
    branch: '',
    paramsJson: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let paramsJson = {};
      if (formData.paramsJson.trim()) {
        paramsJson = JSON.parse(formData.paramsJson);
      }

      const response = await fetch(`${API}/experiments/${experimentId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: formData.status,
          gitCommitSha: formData.gitCommitSha || undefined,
          branch: formData.branch || undefined,
          paramsJson: Object.keys(paramsJson).length > 0 ? paramsJson : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create run' }));
        throw new Error(errorData.message || 'Failed to create run');
      }

      const createdRun = await response.json();
      console.log('Run created successfully:', createdRun);
      
      // Small delay to ensure backend has processed the run
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to create run');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 32,
          maxWidth: 600,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#111827' }}>Create Experiment Run</h2>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 24, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            >
              <option value="QUEUED">QUEUED</option>
              <option value="RUNNING">RUNNING</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
              Git Commit SHA (optional)
            </label>
            <input
              type="text"
              value={formData.gitCommitSha}
              onChange={(e) => setFormData({ ...formData, gitCommitSha: e.target.value })}
              placeholder="abc123def456"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
              Branch (optional)
            </label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="main"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
              Parameters JSON (optional)
            </label>
            <textarea
              value={formData.paramsJson}
              onChange={(e) => setFormData({ ...formData, paramsJson: e.target.value })}
              placeholder='{"learning_rate": 0.001, "batch_size": 32}'
              rows={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 20px',
                background: submitting ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              {submitting ? 'Creating...' : 'Create Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

