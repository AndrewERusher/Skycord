import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CallViewProps {
  contact: any;
  type: 'video' | 'audio';
  myId: string;
  onEndCall: () => void;
  callRole: 'caller' | 'callee';
}

// How long to wait for the call to connect before giving up.
const CALL_SETUP_TIMEOUT_MS = 45000;

export default function CallView({ contact, type, myId, onEndCall, callRole }: CallViewProps) {
  const [duration, setDuration] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(type === 'audio');
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'failed'>('calling');
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  // ICE candidates that arrive before the remote description is set.
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const setupTimeoutRef = useRef<number | null>(null);

  const callStarted = useRef(false);

  useEffect(() => {
    if (callStarted.current) return;
    callStarted.current = true;
    startCall();
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => {
      clearInterval(timer);
      cleanup();
    };
  }, []);

  const clearSetupTimeout = () => {
    if (setupTimeoutRef.current !== null) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
    }
  };

  const markConnected = () => {
    clearSetupTimeout();
    setCallStatus('connected');
  };

  const markFailed = (message: string) => {
    clearSetupTimeout();
    setError(message);
    setCallStatus('failed');
  };

  const cleanup = () => {
    callStarted.current = false;
    clearSetupTimeout();
    pendingCandidatesRef.current = [];
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    if (channelRef.current) supabase.removeChannel(channelRef.current);
  };

  const getIceServers = (): RTCIceServer[] => {
    const servers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
    // Optional TURN server for NAT traversal. Configure via .env
    // (see .env.example). Without TURN, calls fail on strict NATs,
    // which is the most common reason calls never connect.
    const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
    const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;
    if (turnUrl && turnUsername && turnCredential) {
      servers.push({ urls: turnUrl, username: turnUsername, credential: turnCredential });
    } else {
      console.warn('[Skycord] No TURN server configured (VITE_TURN_URL not set). Calls may fail on strict NATs.');
    }
    return servers;
  };

  // Add an ICE candidate, queueing it if the remote description isn't set yet.
  const handleRemoteCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    if (pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[Skycord] Failed to add ICE candidate', e);
      }
    } else {
      pendingCandidatesRef.current.push(candidate);
    }
  };

  const flushPendingCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;
    const queued = pendingCandidatesRef.current.splice(0);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[Skycord] Failed to add queued ICE candidate', e);
      }
    }
  };

  const startCall = async () => {
    try {
      const constraints = { audio: true, video: type === 'video' };
      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(() => {
        // Fallback: audio only if camera fails
        return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({ iceServers: getIceServers() });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          markConnected();
        }
      };

      // Surface real connection failures instead of hanging on "Calling..."
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          markConnected();
        } else if (state === 'failed') {
          markFailed('Connection failed. Check your network connection or TURN server configuration.');
        } else if (state === 'closed') {
          markFailed('Call ended unexpectedly.');
        }
      };

      // Give up if the call never connects (e.g. the other side never answers).
      setupTimeoutRef.current = window.setTimeout(() => {
        setCallStatus(prev => {
          if (prev === 'calling') {
            setError('Call timed out. The other person may be offline or unreachable.');
            return 'failed';
          }
          return prev;
        });
      }, CALL_SETUP_TIMEOUT_MS);

      // Use Supabase realtime as signaling channel
      const channelName = [myId, contact.id].sort().join('-');
      const channel = supabase.channel(`call:${channelName}`);
      channelRef.current = channel;

      channel.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
        if (payload.from === myId) return; // ignore our own signals
        if (payload.type === 'ready' && callRole === 'caller') {
          // Callee is ready, send the offer!
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: 'broadcast', event: 'signal', payload: { type: 'offer', sdp: offer, from: myId } });
        } else if (payload.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          await flushPendingCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({ type: 'broadcast', event: 'signal', payload: { type: 'answer', sdp: answer, from: myId } });
        } else if (payload.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          await flushPendingCandidates();
          markConnected();
        } else if (payload.type === 'ice') {
          if (payload.candidate) await handleRemoteCandidate(payload.candidate);
        }
      });

      // We must subscribe before we send any signals
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (callRole === 'callee') {
            // Tell the caller we are ready to receive the offer
            channel.send({ type: 'broadcast', event: 'signal', payload: { type: 'ready', from: myId } });
          }
        }
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({ type: 'broadcast', event: 'signal', payload: { type: 'ice', candidate: event.candidate, from: myId } });
        }
      };

    } catch (err: any) {
      markFailed(err.message || 'Could not access microphone/camera');
    }
  };

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = micMuted; });
    setMicMuted(!micMuted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoOff; });
    setVideoOff(!videoOff);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ flex: 1, backgroundColor: '#0f1115', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

      {/* Remote video (full screen) */}
      {callStatus === 'connected' && type === 'video' ? (
        <video ref={remoteVideoRef} autoPlay playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <div style={{ color: '#a0a4b0' }}>
            {callStatus === 'calling' && 'Calling...'}
            {callStatus === 'connected' && formatTime(duration)}
            {callStatus === 'failed' && (
              <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> {error || 'Call failed'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Local video pip */}
      {type === 'video' && !videoOff && (
        <video ref={localVideoRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: '120px', right: '24px', width: '160px', height: '100px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)', zIndex: 20 }} />
      )}

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: '48px', display: 'flex', gap: '24px', zIndex: 30, backgroundColor: 'rgba(0,0,0,0.5)', padding: '16px 32px', borderRadius: '32px' }}>
        <button onClick={toggleMic} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', backgroundColor: micMuted ? '#fff' : 'rgba(255,255,255,0.2)', color: micMuted ? '#000' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
          {micMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        {type === 'video' && (
          <button onClick={toggleVideo} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', backgroundColor: videoOff ? '#fff' : 'rgba(255,255,255,0.2)', color: videoOff ? '#000' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
            {videoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        )}
        <button onClick={() => { cleanup(); onEndCall(); }} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--danger)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
