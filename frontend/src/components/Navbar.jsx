import React, { useEffect, useState } from 'react';
import { MessageSquare, Video, Users, Sparkles, Shield } from 'lucide-react';

export default function Navbar({ mode, setMode, resetChat }) {
  const [onlineUsers, setOnlineUsers] = useState(1);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${baseUrl}/api/status/`);
        if (res.ok) {
          const data = await res.json();
          if (data.active_users !== undefined) {
            setOnlineUsers(data.active_users);
          }
        }
      } catch (err) {
        // Keep current count on error
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(7, 9, 19, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => resetChat()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
        }}>
          <Sparkles style={{ width: '22px', height: '22px', color: '#fff' }} />
        </div>
        <div>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            omegle<span style={{ color: '#6366f1' }}>.next</span>
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Talk to strangers!
          </p>
        </div>
      </div>

      {/* Center Navigation Mode Pills */}
      {mode && (
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setMode('text')}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              background: mode === 'text' ? 'var(--primary)' : 'transparent',
              color: mode === 'text' ? '#fff' : 'var(--text-muted)'
            }}
          >
            <MessageSquare style={{ width: '16px', height: '16px' }} />
            Text Mode
          </button>

          <button
            onClick={() => setMode('video')}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              background: mode === 'video' ? 'var(--accent-pink)' : 'transparent',
              color: mode === 'video' ? '#fff' : 'var(--text-muted)'
            }}
          >
            <Video style={{ width: '16px', height: '16px' }} />
            Video Mode
          </button>
        </div>
      )}

      {/* Online Users Pill & No-Login Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#10b981',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 10px #10b981'
          }}></span>
          <Users style={{ width: '15px', height: '15px' }} />
          <span>{onlineUsers.toLocaleString()} online</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          color: '#818cf8',
          fontSize: '0.8rem',
          fontWeight: '500'
        }}>
          <Shield style={{ width: '14px', height: '14px' }} />
          <span>No Login Required</span>
        </div>
      </div>
    </header>
  );
}
