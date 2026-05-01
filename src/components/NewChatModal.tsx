import { useState } from 'react';
import { X, Search } from 'lucide-react';

interface Contact {
  id: string | number;
  name: string;
  avatarUrl?: string;
  status: string;
  isGroup: boolean;
}

interface NewChatModalProps {
  onClose: () => void;
  onCreate: (name: string, isGroup: boolean, selectedIds: (string | number)[]) => void;
  title: string;
  contacts: Contact[];
}

export default function NewChatModal({ onClose, onCreate, title, contacts }: NewChatModalProps) {
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<(string | number)[]>([]);

  const isGroup = title === 'New Group';

  const toggleContact = (id: string | number) => {
    if (isGroup) {
      if (selectedContacts.includes(id)) {
        setSelectedContacts(selectedContacts.filter(c => c !== id));
      } else {
        setSelectedContacts([...selectedContacts, id]);
      }
    } else {
      // 1-on-1 chat allows only exactly one selection
      setSelectedContacts(selectedContacts.includes(id) ? [] : [id]);
    }
  };

  const filteredContacts = contacts.filter(c => !c.isGroup && c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // "if a chat doesn't have two people the chat should be grayed out"
  const isValid = isGroup ? (name.trim().length > 0 && selectedContacts.length > 0) : (selectedContacts.length === 1);

  const handleSubmit = () => {
    if (isValid) {
      onCreate(name, isGroup, selectedContacts);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '450px', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {isGroup && (
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label className="input-label">Group Name</label>
              <input 
                className="input-field" 
                placeholder="Enter group name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={isGroup}
              />
            </div>
          )}

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="input-label">Add People</label>
            <div className="search-input-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                className="input-field" 
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px' }}
                autoFocus={!isGroup}
              />
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredContacts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No friends found.</div>
            ) : (
              filteredContacts.map(contact => {
                const isSelected = selectedContacts.includes(contact.id);
                return (
                  <div 
                    key={contact.id} 
                    className="btn"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                    onClick={() => toggleContact(contact.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar-container" style={{ width: '32px', height: '32px' }}>
                        {contact.avatarUrl ? (
                          <img src={contact.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          contact.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <span style={{ fontWeight: 500 }}>{contact.name}</span>
                    </div>
                    {isSelected && <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '10px', height: '10px', backgroundColor: 'white', borderRadius: '50%' }} />
                    </div>}
                  </div>
                )
              })
            )}
          </div>
        </div>
        
        <div className="modal-footer" style={{ marginTop: '16px' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={!isValid}
            style={{ opacity: isValid ? 1 : 0.5, cursor: isValid ? 'pointer' : 'not-allowed' }}
          >
            {isGroup ? 'Create Group' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
