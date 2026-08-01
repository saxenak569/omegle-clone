import React, { useState } from 'react';
import { MessageSquare, Video, ShieldCheck, Zap, Globe, Tag, Sparkles, AlertCircle } from 'lucide-react';

export default function Home({ onStartChat }) {
  const [tags, setTags] = useState('');

  const handleStart = (mode) => {
    onStartChat(mode, tags.split(',').map(t => t.trim()).filter(Boolean));
  };

  return (
    <main style={{
      maxWidth: '1000px',
      margin: '40px auto',
      padding: '0 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px'
    }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '30px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          color: '#818cf8',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          <Sparkles style={{ width: '16px', height: '16px' }} />
          Zero Registration • Ultra-Low Latency • Encrypted WebRTC
        </div>

        <h2 style={{
          fontSize: '3rem',
          fontWeight: '800',
          lineHeight: '1.15',
          letterSpacing: '-0.03em',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Meet Random People Worldwide Instantaneously
        </h2>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          lineHeight: '1.6'
        }}>
          Pick a option below to get matched with a random stranger. 
          No signup, no profile creation, no personal data saved.
        </p>
      </div>

      {/* Main Choice Cards Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        width: '100%'
      }}>
        {/* Text Mode Card */}
        <div 
          className="glass-card glass-card-interactive"
          style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />

          <div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: '#818cf8'
            }}>
              <MessageSquare style={{ width: '28px', height: '28px' }} />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
              Text Chat
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Instant anonymous text messaging. High-speed WebSocket connection with typing indicators & fast matching.
            </p>
          </div>

          <button
            onClick={() => handleStart('text')}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            Start Text Chat
          </button>
        </div>

        {/* Video Mode Card */}
        <div 
          className="glass-card glass-card-interactive"
          style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />

          <div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: '#f472b6'
            }}>
              <Video style={{ width: '28px', height: '28px' }} />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
              Video Chat
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Peer-to-Peer WebRTC live video & audio streams with built-in side chat and camera control options.
            </p>
          </div>

          <button
            onClick={() => handleStart('video')}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            Start Video Chat
          </button>
        </div>
      </div>

      {/* Optional Interests Box */}
      <div className="glass-card" style={{ width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Tag style={{ width: '20px', height: '20px', color: '#818cf8' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: '600' }}>
            What do you want to talk about? (Optional)
          </h4>
        </div>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Add interests separated by commas (e.g. music, coding, gaming, travel)"
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(15, 23, 42, 0.6)',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        width: '100%',
        marginTop: '10px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Zap style={{ width: '22px', height: '22px', color: '#6366f1', flexShrink: 0 }} />
          <div>
            <h5 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>Sub-Millisecond Pairing</h5>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Powered by in-memory lock-free Redis queues for zero delay.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <ShieldCheck style={{ width: '22px', height: '22px', color: '#10b981', flexShrink: 0 }} />
          <div>
            <h5 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>100% Anonymous</h5>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No emails, passwords, or personal details stored ever.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Globe style={{ width: '22px', height: '22px', color: '#ec4899', flexShrink: 0 }} />
          <div>
            <h5 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>P2P WebRTC Direct</h5>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Encrypted video streams straight peer-to-peer for maximum quality.</p>
          </div>
        </div>
      </div>

      {/* Community Warning Disclaimer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#f87171',
        fontSize: '0.85rem',
        lineHeight: '1.4',
        width: '100%'
      }}>
        <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
        <div>
          <strong>Safety Notice:</strong> You must be 18+ to use this platform. Do not share sensitive personal information (credit cards, address, SSN) with strangers online.
        </div>
      </div>
    </main>
  );
}
