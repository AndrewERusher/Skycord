import { useState } from 'react';
import { X, Moon, Sun, Camera, Mic, Bot, Video } from 'lucide-react';

interface SettingsModalProps {
  theme: 'light' | 'dark' | 'rusher';
  setTheme: (theme: 'light' | 'dark' | 'rusher') => void;
  onClose: () => void;
}

export default function SettingsModal({ theme, setTheme, onClose }: SettingsModalProps) {
  const [autoRecord, setAutoRecord] = useState(false);

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
        <div className="modal-header">
          <h2>Options</h2>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Theme Settings */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Appearance</h3>
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <span>Light / Dark Mode</span>
              <button 
                className="btn btn-secondary" 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} 
                Toggle Mode
              </button>
            </div>
            <div className="input-group">
              <label className="input-label">Theme Selection</label>
              <select 
                className="input-field" 
                value={theme} 
                onChange={(e) => setTheme(e.target.value as any)}
                style={{ appearance: 'auto' }}
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
                <option value="rusher">Rusher's Theme</option>
              </select>
            </div>
          </div>

          {/* AV Settings */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Audio & Video</h3>
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} /> Camera
              </div>
              <select className="input-field" style={{ width: 'auto', padding: '6px 12px', appearance: 'auto' }}>
                <option>Default Webcam</option>
              </select>
            </div>
            <div className="flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={18} /> Microphone
              </div>
              <select className="input-field" style={{ width: 'auto', padding: '6px 12px', appearance: 'auto' }}>
                <option>Default System Mic</option>
              </select>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Advanced Features</h3>
            
            <div className="flex-between" style={{ marginBottom: '16px', opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} /> Skycord AI
                <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px' }}>Coming Soon</span>
              </div>
              <input type="checkbox" disabled />
            </div>

            <div className="flex-between">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Video size={18} /> Automatic Recording
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Saves automatically to "Call Recordings" folder.
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={autoRecord} 
                onChange={(e) => setAutoRecord(e.target.checked)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

          </div>

        </div>
        
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
