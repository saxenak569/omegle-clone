import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import TextChat from './components/TextChat';
import VideoChat from './components/VideoChat';

export default function App() {
  const [mode, setMode] = useState(null); // null (Home), 'text', 'video'
  const [interests, setInterests] = useState([]);

  const handleStartChat = (selectedMode, tags) => {
    setInterests(tags);
    setMode(selectedMode);
  };

  const handleReset = () => {
    setMode(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar mode={mode} setMode={setMode} resetChat={handleReset} />

      {!mode && <Home onStartChat={handleStartChat} />}

      {mode === 'text' && (
        <TextChat 
          onBack={handleReset}
          interests={interests}
        />
      )}

      {mode === 'video' && (
        <VideoChat 
          onBack={handleReset}
          interests={interests}
        />
      )}
    </div>
  );
}
