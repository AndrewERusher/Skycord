import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  status: string;
  isGroup: boolean;
  avatarUrl?: string;
}

interface ContactsViewProps {
  contacts: Contact[];
  onStartChat: (contactId: number) => void;
}

export default function ContactsView({ contacts, onStartChat }: ContactsViewProps) {
  const [filter, setFilter] = useState('');

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', padding: '32px' }}>
      <h1 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Address Book</h1>
      
      <input 
        type="text" 
        placeholder="Search contacts..." 
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '24px', maxWidth: '400px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map(contact => (
          <div key={contact.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', position: 'relative', color: 'var(--text-primary)' }}>
              {contact.avatarUrl ? (
                <img src={contact.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                contact.name.substring(0, 2).toUpperCase()
              )}
              {!contact.isGroup && (
                <div className={`status-indicator status-${contact.status}`} style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px' }}></div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{contact.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{contact.status}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="icon-btn" onClick={() => onStartChat(contact.id)}><MessageCircle size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
