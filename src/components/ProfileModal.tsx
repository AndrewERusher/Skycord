import { useState, useRef, useEffect } from 'react';
import { X, Camera, ShieldCheck, ShieldAlert, MapPin, Loader2 } from 'lucide-react';

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onSave: (user: any) => void;
}

export default function ProfileModal({ user, onClose, onSave }: ProfileModalProps) {
  const [formData, setFormData] = useState({ 
    ...user, 
    bio: user.bio || '', 
    avatarUrl: user.avatarUrl || '',
    firstName: user.firstName || '',
    middleName: user.middleName || '',
    lastName: user.lastName || '',
    country: user.country || '',
    state: user.state || '',
    city: user.city || '',
    zipcode: user.zipcode || '',
    privacySettings: user.privacySettings || { firstName: 'private', middleName: 'private', lastName: 'private', country: 'private', state: 'private', city: 'private', zipcode: 'private' },
    idImageUrl: user.idImageUrl || '',
    isVerified: user.isVerified || false
  });
  
  const [countries, setCountries] = useState<string[]>(["United States", "United Kingdom", "Canada", "Australia"]);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name')
      .then(res => res.json())
      .then(data => {
        const sorted = data.map((c: any) => c.name.common).sort();
        setCountries(sorted);
      })
      .catch(console.error);
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`);
          const data = await res.json();
          if (data && data.address) {
            setFormData((prev: any) => ({
              ...prev,
              country: data.address.country || prev.country,
              state: data.address.state || data.address.region || prev.state,
              city: data.address.city || data.address.town || data.address.village || prev.city
            }));
          }
        } catch (err) {
          alert("Could not fetch location data from coordinates");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        alert("Unable to retrieve your location: " + err.message);
        setIsLocating(false);
      }
    );
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrivacyChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      privacySettings: {
        ...formData.privacySettings,
        [field]: value
      }
    });
  };

  const handleStatusChange = (status: string) => {
    setFormData({ ...formData, status });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData({ ...formData, avatarUrl: url });
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData({ ...formData, idImageUrl: url });
    }
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  const statuses = [
    { id: 'online', label: 'Online', color: 'var(--status-online)' },
    { id: 'away', label: 'Away', color: 'var(--status-away)' },
    { id: 'dnd', label: 'Do Not Disturb', color: 'var(--status-dnd)' },
    { id: 'offline', label: 'Offline', color: 'var(--status-offline)' },
  ];

  const renderFieldWithPrivacy = (label: string, name: string) => (
    <div className="input-group" style={{ marginBottom: '16px' }}>
      <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label}
        <select 
          value={formData.privacySettings[name] || 'private'} 
          onChange={(e) => handlePrivacyChange(name, e.target.value)}
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', padding: '2px 4px' }}
        >
          <option value="public">Public</option>
          <option value="friends">Limited to Friends</option>
          <option value="private">Private</option>
        </select>
      </label>
      {name === 'country' ? (
        <select 
          name={name}
          className="input-field" 
          value={formData[name]}
          onChange={handleChange as any}
        >
          <option value="">Select a country...</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <input 
          type="text" 
          name={name}
          className="input-field" 
          value={formData[name]}
          onChange={handleChange}
        />
      )}
    </div>
  );

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h2>User Profile {formData.isVerified && <span title="Verified User"><ShieldCheck size={20} color="var(--success)" style={{ marginLeft: '8px', verticalAlign: 'text-bottom' }} /></span>}</h2>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Avatar and Verification */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div className="profile-avatar-edit" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer', textAlign: 'center', margin: 0 }}>
              <div className="profile-avatar-large" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  formData.name.substring(0, 2).toUpperCase()
                )}
                <div className="edit-avatar-overlay">
                  <Camera size={28} color="white" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
            </div>

            <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ID Verification {formData.isVerified ? <ShieldCheck size={16} color="var(--success)"/> : <ShieldAlert size={16} color="var(--warning)"/>}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {formData.isVerified ? "Your identity is verified." : "Upload a government-issued ID to verify your account and get a verification badge."}
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => idInputRef.current?.click()}>
                  {formData.idImageUrl ? 'Change ID Image' : 'Upload ID'}
                </button>
                {formData.idImageUrl && <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>ID Selected</span>}
              </div>
              <input type="file" ref={idInputRef} onChange={handleIdChange} style={{ display: 'none' }} accept="image/*" />
            </div>
          </div>

          <div className="status-selector" style={{ marginBottom: 0 }}>
            {statuses.map(s => (
              <div 
                key={s.id}
                className={`status-option ${formData.status === s.id ? 'selected' : ''}`}
                onClick={() => handleStatusChange(s.id)}
              >
                <div className="status-dot-large" style={{ backgroundColor: s.color }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Display Name</label>
              <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label">Username</label>
              <input type="text" name="username" className="input-field" value={formData.username} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">About Me</label>
            <textarea name="bio" className="input-field" value={formData.bio} onChange={handleChange} style={{ minHeight: '60px', resize: 'vertical' }} />
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Personal Identity</h3>
              <button 
                className="btn" 
                style={{ fontSize: '0.75rem', padding: '4px 10px', backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', gap: '6px' }}
                onClick={handleLocateMe}
                disabled={isLocating}
              >
                {isLocating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                {isLocating ? 'Locating...' : 'Auto-fill Location'}
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {renderFieldWithPrivacy('First Name', 'firstName')}
              {renderFieldWithPrivacy('Middle Name', 'middleName')}
              {renderFieldWithPrivacy('Last Name', 'lastName')}
              {renderFieldWithPrivacy('Country', 'country')}
              {renderFieldWithPrivacy('State', 'state')}
              {renderFieldWithPrivacy('City', 'city')}
              {renderFieldWithPrivacy('Zipcode', 'zipcode')}
            </div>
          </div>

        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
