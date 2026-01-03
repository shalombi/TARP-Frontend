'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  replies: Comment[];
  mentions: Array<{
    user: {
      id: string;
      username: string;
      name: string;
    };
  }>;
  _count: {
    replies: number;
  };
};

interface CommentsSectionProps {
  artifactId: string;
}

export default function CommentsSection({ artifactId }: CommentsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [artifactId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API}/artifacts/${artifactId}/comments`, {
        credentials: 'include',
      });
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    try {
      const response = await fetch(`${API}/artifacts/${artifactId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleReply = async (parentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !isAuthenticated) return;

    try {
      const response = await fetch(`${API}/artifacts/${artifactId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (response.ok) {
        setReplyContent('');
        setReplyingTo(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    }
  };

  const handleEdit = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || !isAuthenticated) return;

    try {
      const response = await fetch(
        `${API}/artifacts/${artifactId}/comments/${commentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: editContent }),
        },
      );

      if (response.ok) {
        setEditContent('');
        setEditingId(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(
        `${API}/artifacts/${artifactId}/comments/${commentId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderMentions = (content: string, mentions: Comment['mentions']) => {
    if (!mentions || mentions.length === 0) {
      return content;
    }
    let text = content;
    mentions.forEach((mention) => {
      if (mention?.user?.username) {
        const regex = new RegExp(`@${mention.user.username}`, 'g');
        text = text.replace(
          regex,
          `<span style="color: #667eea; font-weight: 600;">@${mention.user.username}</span>`,
        );
      }
    });
    return text;
  };

  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Comment;
    depth?: number;
  }) => {
    const isAuthor = user?.id === comment.author.id;
    const isEditing = editingId === comment.id;

    return (
      <div
        style={{
          marginLeft: depth > 0 ? 32 : 0,
          marginTop: 16,
          padding: 20,
          background: 'white',
          borderRadius: 12,
          border: '1px solid rgba(148, 163, 184, 0.2)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 600,
              color: 'white',
              flexShrink: 0,
            }}
          >
            {comment.author.name[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>
                {comment.author.name}
              </span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>
                {formatDate(comment.createdAt)}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                  (edited)
                </span>
              )}
            </div>
            {isEditing ? (
              <form
                onSubmit={(e) => handleEdit(comment.id, e)}
                style={{ marginTop: 8 }}
              >
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    fontSize: 14,
                    minHeight: 80,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: 'white',
                      color: '#64748b',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                style={{
                  fontSize: 14,
                  color: '#475569',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
                dangerouslySetInnerHTML={{
                  __html: renderMentions(comment.content, comment.mentions || []),
                }}
              />
            )}
          </div>
        </div>

        {!isEditing && (
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {isAuthenticated && (
              <button
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyContent('');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#475569';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                Reply
              </button>
            )}
            {isAuthor && (
              <>
                <button
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: '#ef4444',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {replyingTo === comment.id && (
          <form
            onSubmit={(e) => handleReply(comment.id, e)}
            style={{
              marginTop: 16,
              padding: 16,
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.3)',
                fontSize: 14,
                minHeight: 80,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Post Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'white',
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {comment.replies.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <Loader text="Loading comments..." />;
  }

  return (
    <div style={{ marginTop: 48 }}>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 24,
          color: '#1e293b',
        }}
      >
        Comments ({comments.length})
      </h2>

      {isAuthenticated && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: 32,
            padding: 20,
            background: 'white',
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (Use @username to mention someone)"
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.3)',
              fontSize: 14,
              minHeight: 100,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              type="submit"
              disabled={!newComment.trim()}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: newComment.trim()
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#cbd5e1',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Post Comment
            </button>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: 'white',
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#94a3b8',
          }}
        >
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

