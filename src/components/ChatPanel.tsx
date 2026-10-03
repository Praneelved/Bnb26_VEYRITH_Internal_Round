import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { getInitials, getSpeakerColor } from '../utils';
import './ChatPanel.css';

interface ChatPanelProps {
  onClose: () => void;
}

const QUICK_EMOJIS = ['👍', '👏', '❤️', '✋', '🎉', '🔥'];

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { chatMessages, addChatMessage, userProfile, myParticipantId, clearUnreadChat } = useAppStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clearUnreadChat();
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, clearUnreadChat]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    addChatMessage({
      senderId: myParticipantId || 'local-user',
      senderName: userProfile.name || 'You',
      text: inputText.trim(),
      colorIndex: 1,
    });
    setInputText('');
  };

  const handleQuickEmoji = (emoji: string) => {
    addChatMessage({
      senderId: myParticipantId || 'local-user',
      senderName: userProfile.name || 'You',
      text: emoji,
      colorIndex: 1,
    });
  };

  const formatMessageTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className="side-panel chat-panel animate-slide-left" role="dialog" aria-label="In-call chat">
      <div className="side-panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">In-call messages</h2>
          <span className="panel-count-chip">{chatMessages.length}</span>
        </div>
        <button className="panel-close-btn" onClick={onClose} aria-label="Close chat panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="chat-disclaimer-box">
        Messages can be seen only by people in the call and are deleted when the call ends.
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages-scroll">
        {chatMessages.length === 0 ? (
          <div className="panel-empty-text">No messages yet. Say hello to everyone!</div>
        ) : (
          chatMessages.map((msg) => {
            const isLocal = msg.senderId === (myParticipantId || 'local-user');
            const color = getSpeakerColor(msg.colorIndex);

            return (
              <div key={msg.id} className={`chat-message-item ${isLocal ? 'chat-message--local' : ''}`}>
                <div className="chat-avatar" style={{ background: color }}>
                  {getInitials(msg.senderName)}
                </div>
                <div className="chat-content-wrap">
                  <div className="chat-meta-line">
                    <span className="chat-sender-name">{msg.senderName}</span>
                    <span className="chat-timestamp">{formatMessageTime(msg.timestamp)}</span>
                  </div>
                  <div className="chat-bubble-text">{msg.text}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reaction Bar */}
      <div className="chat-quick-reactions">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="quick-emoji-btn"
            onClick={() => handleQuickEmoji(emoji)}
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="chat-input-form">
        <input
          type="text"
          placeholder="Send a message to everyone..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="chat-text-input"
          aria-label="Chat message"
        />
        <button
          type="submit"
          className={`chat-send-btn ${inputText.trim() ? 'active' : ''}`}
          disabled={!inputText.trim()}
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </aside>
  );
}
