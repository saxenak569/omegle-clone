import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Send, SkipForward, Square, RotateCcw, UserCheck, AlertTriangle, Sparkles } from 'lucide-react';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function VideoChat({ onBack }) {
  const [status, setStatus] = useState('connecting'); // connecting, waiting, matched, disconnected
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [stopConfirm, setStopConfirm] = useState(false);

  // Audio / Video toggles
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  // References
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const sessionIdRef = useRef('user_vid_' + Math.random().toString(36).substring(2, 11));
  const roleRef = useRef(null);
  const isUserIntentionalStopRef = useRef(false);

  useEffect(() => {
    startMediaAndConnect();
    return () => {
      isUserIntentionalStopRef.current = true;
      cleanupWebRTC();
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const startMediaAndConnect = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Could not access camera/microphone:", err);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        text: 'Warning: Camera/Microphone access denied.'
      }]);
    }

    connectWebSocket();
  };

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
        { id: Date.now(), type: 'system', text: 'Connected. Looking for a video chat partner...' }
      ]);
      ws.send(JSON.stringify({
        action: 'find_match',
        session_id: sessionIdRef.current,
        mode: 'video'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerAction(data);
      } catch (err) {
        console.error("Error parsing signaling data", err);
      }
    };

    ws.onclose = () => {
      if (!isUserIntentionalStopRef.current && status === 'waiting') {
        setTimeout(connectWebSocket, 1500);
      } else {
        setStatus('disconnected');
      }
    };
  };

  const createPeerConnection = () => {
    cleanupPeerConnection();

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.send(JSON.stringify({
          action: 'signal',
          signal: { type: 'ice-candidate', candidate: event.candidate }
        }));
      }
    };

    return pc;
  };

  const handleServerAction = async (data) => {
    switch (data.action) {
      case 'waiting':
        setStatus('waiting');
        break;

      case 'matched':
        setStatus('matched');
        setStopConfirm(false);
        roleRef.current = data.role;
        setMessages(prev => [
          ...prev,
          { id: Date.now(), type: 'system', text: "Connected to a stranger via Video WebRTC!" }
        ]);

        const pc = createPeerConnection();

        if (data.role === 'initiator') {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current.send(JSON.stringify({
              action: 'signal',
              signal: { type: 'offer', sdp: offer }
            }));
          } catch (err) {
            console.error("Failed to create offer:", err);
          }
        }
        break;

      case 'signal':
        handleSignalData(data.signal);
        break;

      case 'message':
        setMessages(prev => [
          ...prev,
          { id: Date.now(), type: 'stranger', text: data.message }
        ]);
        break;

      case 'partner_disconnected':
        setStatus('disconnected');
        cleanupPeerConnection();
        setMessages(prev => [
          ...prev,
          { id: Date.now(), type: 'system', text: 'Stranger has disconnected.' }
        ]);
        break;

      default:
        break;
    }
  };

  const handleSignalData = async (signal) => {
    let pc = peerConnectionRef.current;
    if (!pc) return;

    if (signal.type === 'offer') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current.send(JSON.stringify({
          action: 'signal',
          signal: { type: 'answer', sdp: answer }
        }));
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    } else if (signal.type === 'answer') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    } else if (signal.type === 'ice-candidate') {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const cleanupPeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const cleanupWebRTC = () => {
    cleanupPeerConnection();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startNextMatch = () => {
    isUserIntentionalStopRef.current = false;
    setStopConfirm(false);
    cleanupPeerConnection();
    setStatus('waiting');
    setMessages([
      { id: Date.now(), type: 'system', text: 'Looking for a new video partner...' }
    ]);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'next',
        mode: 'video'
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

  const sendMessage = () => {
    if (!inputText.trim() || status !== 'matched' || !socketRef.current) return;

    socketRef.current.send(JSON.stringify({
      action: 'send_message',
      message: inputText.trim()
    }));

    setMessages(prev => [
      ...prev,
      { id: Date.now(), type: 'user', text: inputText.trim() }
    ]);
    setInputText('');
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '16px auto',
      height: 'calc(100vh - 110px)',
      display: 'grid',
      gridTemplateColumns: '1fr 340px',
      gap: '16px',
      padding: '0 16px'
    }}>
      {/* Left Column: Dual Video Streams & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
        {/* Video Streams Container */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: '12px'
        }}>
          {/* Stranger Video Container */}
          <div className="video-container">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-element"
            />
            
            <div className="video-overlay">
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: status === 'matched' ? '#10b981' : '#f59e0b'
              }} />
              <span>Stranger ({status === 'matched' ? 'Connected' : status === 'waiting' ? 'Searching...' : 'Disconnected'})</span>
            </div>

            {status === 'waiting' && (
              <div style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--text-muted)'
              }}>
                <div className="typing-dots"><span></span><span></span><span></span></div>
                <span>Looking for a video chat stranger...</span>
              </div>
            )}

            {status === 'disconnected' && (
              <div style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                padding: '20px',
                background: 'rgba(7, 9, 19, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ color: '#f87171', fontWeight: '600', fontSize: '1rem' }}>
                  Stranger has disconnected
                </span>
                <button
                  onClick={startNextMatch}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Sparkles style={{ width: '18px', height: '18px' }} />
                  Search Next Stranger
                </button>
              </div>
            )}
          </div>

          {/* Local User Video Container */}
          <div className="video-container">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="video-element"
            />
            
            <div className="video-overlay">
              <span>You (Local Camera)</span>
            </div>
          </div>
        </div>

        {/* Media Toolbar Controls */}
        <div className="glass-card" style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '14px'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={toggleCamera}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: cameraEnabled ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: cameraEnabled ? '#818cf8' : '#f87171',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}
            >
              {cameraEnabled ? <Video style={{ width: '18px', height: '18px' }} /> : <VideoOff style={{ width: '18px', height: '18px' }} />}
              {cameraEnabled ? 'Cam On' : 'Cam Off'}
            </button>

            <button
              onClick={toggleMic}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: micEnabled ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: micEnabled ? '#818cf8' : '#f87171',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}
            >
              {micEnabled ? <Mic style={{ width: '18px', height: '18px' }} /> : <MicOff style={{ width: '18px', height: '18px' }} />}
              {micEnabled ? 'Mic On' : 'Muted'}
            </button>
          </div>

          {/* Next / Disconnect Button */}
          <button
            onClick={handleNextOrStop}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: status === 'matched' 
                ? (stopConfirm ? '#ef4444' : '#334155') 
                : status === 'disconnected'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : '#ef4444',
              color: '#fff',
              boxShadow: status === 'disconnected' ? '0 0 15px rgba(16, 185, 129, 0.5)' : 'none'
            }}
          >
            {status === 'matched' && (stopConfirm ? 'Really?' : 'Stop')}
            {status === 'disconnected' && 'Search Next Stranger'}
            {status === 'waiting' && 'Stop Search'}
            <SkipForward style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* Right Column: Side Chat Panel */}
      <div className="glass-card" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        borderRadius: '16px'
      }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-muted)' }}>
          Side Text Chat
        </h4>

        {/* Message feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              fontSize: '0.85rem',
              padding: '8px 12px',
              borderRadius: '8px',
              background: msg.type === 'user' 
                ? 'var(--msg-user-bg)' 
                : msg.type === 'stranger' 
                  ? 'var(--msg-stranger-bg)' 
                  : 'var(--msg-system-bg)',
              color: msg.type === 'system' ? '#a5b4fc' : '#fff',
              alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}>
              {msg.text}
            </div>
          ))}
        </div>

        {/* Input box */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={status !== 'matched'}
            placeholder={status === 'matched' ? "Text stranger..." : "Waiting..."}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(15, 23, 42, 0.7)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={status !== 'matched' || !inputText.trim()}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <Send style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
