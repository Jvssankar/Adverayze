import { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import {
  fetchMessages, sendMessage,
  deleteForMe, deleteForEveryone, togglePin
} from './api';
import './App.css';

export default function App() {
  const [username, setUsername] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  // Connect socket when logged in
  useEffect(() => {
    if (!loggedIn) return;

    fetchMessages(username)
      .then(res => setMessages(res.data))
      .catch(() => setError('Failed to load messages'));

    socket.connect();

    socket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('messageDeletedForEveryone', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    socket.on('messageDeletedForMe', ({ messageId, username: who }) => {
      if (who === username) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    });

    socket.on('messagePinToggled', ({ messageId, isPinned }) => {
      setMessages(prev =>
        prev.map(m => m._id === messageId ? { ...m, isPinned } : m)
      );
    });

    return () => {
      socket.off('newMessage');
      socket.off('messageDeletedForEveryone');
      socket.off('messageDeletedForMe');
      socket.off('messagePinToggled');
      socket.disconnect();
    };
  }, [loggedIn, username]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!showPinned) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showPinned]);

  const handleLogin = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    setUsername(trimmed);
    setLoggedIn(true);
    setError('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    try {
      await sendMessage(username, trimmed);
    } catch {
      setError('Failed to send message');
    }
  };

  const handleDeleteForMe = async (id) => {
    setMenuOpen(null);
    setMessages(prev => prev.filter(m => m._id !== id));
    try {
      await deleteForMe(id, username);
    } catch {
      setError('Failed to delete message');
    }
  };

  const handleDeleteForEveryone = async (id) => {
    setMenuOpen(null);
    setMessages(prev => prev.filter(m => m._id !== id));
    try {
      await deleteForEveryone(id);
    } catch {
      setError('Failed to delete message');
    }
  };

  const handlePin = async (id) => {
    setMenuOpen(null);
    try {
      await togglePin(id);
    } catch {
      setError('Failed to pin message');
    }
  };

  const pinnedMessages = messages.filter(m => m.isPinned);
  const displayMessages = showPinned ? pinnedMessages : messages;

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // LOGIN SCREEN
  if (!loggedIn) {
    return (
      <div className="login-wrapper">
        <div className="login-box">
          <h1>Adverayze Chat</h1>
          <p>Enter a username to join</p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={50}
              autoFocus
            />
            <button type="submit">Join Chat</button>
          </form>
        </div>
      </div>
    );
  }

  // CHAT SCREEN
  return (
    <div className="chat-wrapper" onClick={() => setMenuOpen(null)}>
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <span className="avatar">{username[0].toUpperCase()}</span>
          <div>
            <div className="header-name">{username}</div>
            <div className="header-status">Online</div>
          </div>
        </div>
        <div className="header-right">
          {pinnedMessages.length > 0 && (
            <button
              className={`pin-toggle ${showPinned ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setShowPinned(p => !p); }}
            >
              📌 {pinnedMessages.length} pinned
            </button>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner" onClick={() => setError('')}>
          {error} ✕
        </div>
      )}

      {/* Messages */}
      <main className="messages-area">
        {displayMessages.length === 0 && (
          <div className="empty-state">
            {showPinned ? 'No pinned messages' : 'No messages yet. Say hello!'}
          </div>
        )}
        {displayMessages.map(msg => {
          const isMine = msg.username === username;
          return (
            <div key={msg._id} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine && <span className="msg-author">{msg.username}</span>}
              <div className="bubble-wrap">
                <div className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'} ${msg.isPinned ? 'pinned' : ''}`}>
                  <span className="msg-content">{msg.content}</span>
                  <span className="msg-time">{formatTime(msg.createdAt)}</span>
                  {msg.isPinned && <span className="pin-badge">📌</span>}
                </div>
                <button
                  className="msg-menu-btn"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === msg._id ? null : msg._id); }}
                  title="Options"
                >⋮</button>
                {menuOpen === msg._id && (
                  <div className={`msg-menu ${isMine ? 'menu-left' : 'menu-right'}`} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handlePin(msg._id)}>
                      {msg.isPinned ? '🔓 Unpin' : '📌 Pin'}
                    </button>
                    <button onClick={() => handleDeleteForMe(msg._id)}>🗑 Delete for me</button>
                    {isMine && (
                      <button className="danger" onClick={() => handleDeleteForEveryone(msg._id)}>
                        ✕ Delete for everyone
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="chat-footer">
        <form onSubmit={handleSend} className="input-form">
          <input
            type="text"
            className="msg-input"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={1000}
            autoFocus
          />
          <button type="submit" className="send-btn" disabled={!input.trim()}>
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}