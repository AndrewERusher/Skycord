import { useState } from 'react';
import { Phone } from 'lucide-react';

export default function DialpadView() {
  const [number, setNumber] = useState('');

  const handleDial = (digit: string) => {
    setNumber(prev => prev + digit);
  };

  const handleCall = () => {
    if (number) {
      alert(`Calling ${number}... (Mock Call)`);
      setNumber('');
    }
  };

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '32px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', width: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Make a Call</h2>
        
        <input 
          type="text" 
          value={number} 
          readOnly 
          placeholder="Enter number..." 
          style={{ width: '100%', padding: '16px', fontSize: '1.5rem', textAlign: 'center', marginBottom: '24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
            <button 
              key={digit} 
              onClick={() => handleDial(digit)}
              style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.25rem', border: 'none', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            >
              {digit}
            </button>
          ))}
        </div>

        <button 
          onClick={handleCall}
          style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--success)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
        >
          <Phone size={24} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
