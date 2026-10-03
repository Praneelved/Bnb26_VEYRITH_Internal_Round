import React, { useState } from 'react';
import { useAppStore } from '../store';
import './FeedbackModal.css';

interface FeedbackModalProps {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { addToast } = useAppStore();
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<'audio' | 'captions' | 'ui' | 'other'>('captions');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    addToast('Thank you for your feedback! ⭐', 'success');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="feedback-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="feedback-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <h3 className="feedback-modal-title">Share Feedback</h3>
          <button className="feedback-close-btn" onClick={onClose} aria-label="Close feedback">
            &times;
          </button>
        </div>

        {submitted ? (
          <div className="feedback-success-state animate-fade-in">
            <span className="feedback-success-icon">🎉</span>
            <h4>Feedback Received</h4>
            <p>Your suggestions help make Roundtable faster, clearer, and more accessible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="rating-section">
              <label className="feedback-label">How was your session experience?</label>
              <div className="star-rating-row" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= rating ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="category-section">
              <label className="feedback-label">Category</label>
              <div className="category-pills">
                {(['captions', 'audio', 'ui', 'other'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-pill ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat === 'captions' && '💬 Live Captions'}
                    {cat === 'audio' && '🎙️ Mic & Audio'}
                    {cat === 'ui' && '✨ Video & UI'}
                    {cat === 'other' && '⚡ Other'}
                  </button>
                ))}
              </div>
            </div>

            <div className="comment-section">
              <label className="feedback-label" htmlFor="feedback-comment">
                What went well or what could be improved?
              </label>
              <textarea
                id="feedback-comment"
                rows={3}
                placeholder="Let us know your thoughts, audio quality impressions, or feature ideas..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="feedback-textarea"
              />
            </div>

            <div className="feedback-modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Send Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
