import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CallViewProps {
  contact: any;
  type: 'video' | 'audio';
  onEndCall: () => void;
}

export default function CallView({ contact, type, onEndCall }: CallViewProps) {
  const [duration, setDuration] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(type === 'audio');

  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ flex: 1, backgroundColor: '#0f1115', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      
      {!videoOff ? (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1d24' }}>
          <div style={{ color: '#fff', fontSize: '1.2rem', opacity: 0.5 }}>Mock Video Stream...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'white', marginBottom: '24px' }}>
            {contact.avatarUrl ? (
              <img src={contact.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              contact.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <h2 style={{ color: 'white', marginBottom: '8px' }}>{contact.name}</h2>
          <div style={{ color: '#a0a4b0' }}>{formatTime(duration)}</div>
        </div>
      )}

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: '48px', display: 'flex', gap: '24px', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: '16px 32px', borderRadius: '32px' }}>
        <button 
          onClick={() => setMicMuted(!micMuted)}
          style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', backgroundColor: micMuted ? '#fff' : 'rgba(255,255,255,0.2)', color: micMuted ? '#000' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
        >
          {micMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button 
          onClick={() => setVideoOff(!videoOff)}
          style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', backgroundColor: videoOff ? '#fff' : 'rgba(255,255,255,0.2)', color: videoOff ? '#000' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
        >
          {videoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
        <button 
          onClick={onEndCall}
          style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--danger)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
