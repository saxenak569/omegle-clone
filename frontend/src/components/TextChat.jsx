import React, { useState, useEffect, useRef } from 'react';
import { Send, SkipForward, Square, RotateCcw, AlertTriangle, UserCheck, Sparkles } from 'lucide-react';

export default function TextChat({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState('connecting'); // connecting, waiting, matched, disconnected
  const [isTyping, setIsTyping] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);

  const socketRef = useRef(null);
  const sessionIdRef = useRef('user_' + Math.random().toString(36).substring(2, 11));
  const chatBottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isUserIntentionalStopRef = useRef(false);

  useEffect(() => {
    connectWebSocket();
    return () => {
      isUserIntentionalStopRef.current = true;
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, status]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleNextOrStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, stopConfirm]);

  const connectWebSocket = () => {
    let wsUrl = '';
    const envWsUrl = import.meta.env.VITE_BACKEND_WS_URL;
    if (envWsUrl) {
      wsUrl = envWsUrl;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/ws/chat/`;
    }

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus('waiting');
      setMessages([
        { id: Date.now(), type: 'system', text: 'Connected. Looking for a stranger...' }
      ]);
      ws.send(JSON.stringify({
        action: 'find_match',
        session_id: sessionIdRef.current,
        mode: 'text'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerAction(data);
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onclose = () => {
      if (!isUserIntentionalStopRef.current && status === 'waiting') {
        setTimeout(connectWebSocket, 1500);
      } else {
        setStatus('disconnected');
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  };

  const handleServerAction = (data) => {
    switch (data.action) {
      case 'waiting':
        setStatus('waiting');
        break;

      case 'matched':
        setStatus('matched');
        setStopConfirm(false);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            type: 'system',
            text: "You're now chatting with a random stranger. Say hi!"
          }
        ]);
        break;

      case 'message':
        setMessages(prev => [
          ...prev,
          { id: Date.now(), type: 'stranger', text: data.message }
        ]);
        setIsTyping(false);
        break;

      case 'typing':
        setIsTyping(data.is_typing);
        break;

      case 'partner_disconnected':
        setStatus('disconnected');
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          { id: Date.now(), type: 'partner_disconnected', text: 'Stranger has disconnected.' }
        ]);
        break;

      case 'stopped':
        setStatus('disconnected');
        break;

      default:
        break;
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || status !== 'matched' || !socketRef.current) return;

    const msgText = inputText.trim();
    socketRef.current.send(JSON.stringify({
      action: 'send_message',
      message: msgText
    }));

    setMessages(prev => [
      ...prev,
      { id: Date.now(), type: 'user', text: msgText }
    ]);

    setInputText('');
    sendTypingStatus(false);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (status === 'matched' && socketRef.current) {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
    }
  };

  const sendTypingStatus = (typing) => {
    if (socketRef.current && status === 'matched') {
      socketRef.current.send(JSON.stringify({
        action: 'typing',
        is_typing: typing
      }));
    }
  };

  const startNextMatch = () => {
    isUserIntentionalStopRef.current = false;
    setStopConfirm(false);
    setStatus('waiting');
    setMessages([
      { id: Date.now(), type: 'system', text: 'Looking for a new stranger...' }
    ]);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'next',
        mode: 'text'
      }));
    } else {
      connectWebSocket();
    }
  };

  const handleNextOrStop = () => {
    if (status === 'matched') {
      if (!stopConfirm) {
        setStopConfirm(true);
      } else {
        startNextMatch();
      }
    } else if (status === 'disconnected') {
      startNextMatch();
    } else if (status === 'waiting') {
      isUserIntentionalStopRef.current = true;
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ action: 'stop' }));
      }
      setStatus('disconnected');
    }
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px auto',
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '0 16px'
    }}>
      {/* Top Status Header */}
      <div className="glass-card" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {status === 'waiting' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
              <div className="typing-dots"><span></span><span></span><span></span></div>
              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Looking for a stranger...</span>
            </div>
          )}

          {status === 'matched' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
              <UserCheck style={{ width: '18px', height: '18px' }} />
              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Connected to Stranger</span>
            </div>
          )}

          {status === 'disconnected' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
              <AlertTriangle style={{ width: '18px', height: '18px' }} />
              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Chat Ended</span>
            </div>
          )}
        </div>

        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Exit Chat
        </button>
      </div>

      {/* Messages Scroll Feed */}
      <div className="glass-card" style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderRadius: '16px'
      }}>
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} style={{
                alignSelf: 'center',
                background: 'var(--msg-system-bg)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#a5b4fc',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '500',
                margin: '6px 0'
              }}>
                {msg.text}
              </div>
            );
          }

          if (msg.type === 'partner_disconnected') {
            return (
              <div key={msg.id} style={{
                alignSelf: 'center',
                width: '100%',
                maxWidth: '480px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '16px 20px',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                margin: '12px 0',
                textAlign: 'center'
              }}>
                <span style={{ color: '#f87171', fontWeight: '600', fontSize: '0.95rem' }}>
                  {msg.text}
                </span>

                <button
                  onClick={startNextMatch}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Sparkles style={{ width: '16px', height: '16px' }} />
                  Search Next Stranger
                </button>
              </div>
            );
          }

          const isUser = msg.type === 'user';
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                marginLeft: '4px',
                marginRight: '4px'
              }}>
                {isUser ? 'You' : 'Stranger'}
              </span>

              <div style={{
                padding: '12px 16px',
                borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                background: isUser ? 'var(--msg-user-bg)' : 'var(--msg-stranger-bg)',
                color: '#fff',
                fontSize: '0.95rem',
                lineHeight: '1.45',
                wordBreak: 'break-word',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '16px',
            background: 'var(--msg-stranger-bg)',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            <span>Stranger is typing</span>
            <div className="typing-dots"><span></span><span></span><span></span></div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Bottom Action Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Disconnect / Next Button */}
        <button
          onClick={handleNextOrStop}
          style={{
            padding: '14px 22px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            background: status === 'matched' 
              ? (stopConfirm ? '#ef4444' : '#334155') 
              : status === 'disconnected' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : '#ef4444',
            color: '#fff',
            boxShadow: status === 'disconnected' ? '0 0 20px rgba(16, 185, 129, 0.5)' : '0 4px 14px rgba(0,0,0,0.3)'
          }}
        >
          {status === 'matched' && (
            stopConfirm ? (
              <>Really? <SkipForward style={{ width: '16px', height: '16px' }} /></>
            ) : (
              <>Stop <Square style={{ width: '14px', height: '14px' }} /></>
            )
          )}
          {status === 'disconnected' && (
            <>Search Next Stranger <RotateCcw style={{ width: '16px', height: '16px' }} /></>
          )}
          {status === 'waiting' && (
            <>Stop Search <Square style={{ width: '14px', height: '14px' }} /></>
          )}
        </button>

        {/* Input Box */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={status !== 'matched'}
            placeholder={status === 'matched' ? "Type a message... (Press Enter)" : "Waiting for stranger..."}
            style={{
              width: '100%',
              padding: '14px 50px 14px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(18, 24, 43, 0.85)',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />

          <button
            onClick={sendMessage}
            disabled={status !== 'matched' || !inputText.trim()}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: inputText.trim() ? 'var(--primary)' : 'transparent',
              color: inputText.trim() ? '#fff' : 'var(--text-dim)',
              cursor: inputText.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <Send style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
