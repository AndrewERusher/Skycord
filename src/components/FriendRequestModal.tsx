import { useState } from 'react';
import { X } from 'lucide-react';

interface FriendRequestModalProps {
  targetUsername: string;
  onClose: () => void;
  onSubmit: (username: string, message: string) => void;
}

export default function FriendRequestModal({ targetUsername, onClose, onSubmit }: FriendRequestModalProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    onSubmit(targetUsername, message);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 200 }}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--accent-primary)' }}>Add Friend</h2>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body">
          <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Sending a friend request to <strong>u/{targetUsername}</strong>. 
            Would you like to add a message explaining why?
          </p>
          <div className="input-group">
            <label className="input-label">Message (Optional)</label>
            <textarea 
              className="input-field" 
              placeholder="Hi! I'm adding you because..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Send Request</button>
        </div>
      </div>
    </div>
  );
}
