import { Phone, Video, PhoneOff } from 'lucide-react';

export default function IncomingCallModal({ call, onAccept, onDecline }: any) {
  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1000 }}>
      <div className="modal-content animate-slide-up" style={{ width: '320px', textAlign: 'center', padding: '32px 24px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', overflow: 'hidden' }}>
          {call.contact.avatarUrl ? (
            <img src={call.contact.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
          ) : (
            call.contact.name.substring(0, 2).toUpperCase()
          )}
        </div>
        <h2 style={{ marginBottom: '8px' }}>{call.contact.name}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Incoming {call.type === 'video' ? 'Video' : 'Audio'} Call...
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button onClick={onDecline} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--danger)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
            <PhoneOff size={24} />
          </button>
          <button onClick={onAccept} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--success)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', animation: 'pulse 2s infinite' }}>
            {call.type === 'video' ? <Video size={24} /> : <Phone size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}
