import { useState } from 'react';
import { Search, Plus, Home, Grip, BookUser, Settings, MoreHorizontal, Clock, MessageCircle, Users } from 'lucide-react';
import FriendRequestModal from './FriendRequestModal';
import { supabase } from '../lib/supabaseClient';

interface Contact {
  id: string | number;
  name: string;
  status: string;
  isGroup: boolean;
  lastMsg: string;
  avatarUrl?: string;
  role?: string;
}

interface SidebarProps {
  onProfileClick: () => void;
  onSettingsClick: () => void;
  currentUser: {
    name: string;
    username: string;
    status: string;
    avatarUrl?: string;
    role?: string;
  };
  contacts: Contact[];
  activeContactId: string | number;
  onSelectContact: (id: string | number) => void;
  setCurrentView: (view: 'chat' | 'home' | 'dialpad' | 'contacts' | 'call') => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onSignOut: () => void;
}

export default function Sidebar({ onProfileClick, onSettingsClick, currentUser, contacts, activeContactId, onSelectContact, setCurrentView, onNewChat, onNewGroup, onSignOut }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFriendRequest, setShowFriendRequest] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [targetUser, setTargetUser] = useState('');
  // @ts-ignore: setUnreadCounts will be used when real-time unread tracking is wired up
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    
    if (query.startsWith('g/') || query.startsWith('sg/')) {
      if (!contact.isGroup) return false;
      
      let isOnlySubgroupSearch = query.startsWith('sg/');
      let groupSearch = '';
      let subgroupSearch = '';
      
      if (isOnlySubgroupSearch) {
        subgroupSearch = query.substring(3).trim().replace(/\s+/g, '');
      } else {
        const parts = query.substring(2).split('sg/');
        groupSearch = parts[0].trim().replace(/\s+/g, '');
        subgroupSearch = parts.length > 1 ? parts[1].trim().replace(/\s+/g, '') : '';
      }

      const normalizedContactName = contact.name.toLowerCase().replace(/\s+/g, '');
      const normalizedParentName = (contact.parentName || '').toLowerCase().replace(/\s+/g, '');

      if (isOnlySubgroupSearch) {
        // Only return subgroups that match the subgroup search
        if (contact.chatType !== 'subgroup') return false;
        return normalizedContactName.includes(subgroupSearch);
      }

      if (subgroupSearch) {
        // Matches e.g., "g/SkycordGaming sg/Playstation"
        if (contact.chatType !== 'subgroup') return false;
        return normalizedContactName.includes(subgroupSearch) && normalizedParentName.includes(groupSearch);
      } else {
        // Matches e.g., "g/SkycordGaming"
        // Should return the main group itself AND its subgroups
        if (contact.chatType === 'subgroup') {
          return normalizedParentName.includes(groupSearch);
        } else {
          return normalizedContactName.includes(groupSearch);
        }
      }
    }

    return contact.name.toLowerCase().includes(query);
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.toLowerCase().startsWith('u/')) {
        const username = searchQuery.substring(2).trim();
        if (username) {
          setTargetUser(username);
          setShowFriendRequest(true);
        }
      } else if (searchQuery.toLowerCase().startsWith('g/') && filteredContacts.length > 0) {
        // If they hit enter on a group search, jump to the top result!
        onSelectContact(filteredContacts[0].id);
        setSearchQuery('');
      }
    }
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <MessageCircle size={20} fill="var(--accent-primary)" color="white" />
        <span>Skycord</span>
      </div>

      <div className="sidebar-nav-icons" style={{ display: 'flex', flexDirection: 'row' }}>
        <div className="left-icons" style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
          <button className="icon-btn" onClick={() => setCurrentView('home')}><Home size={18} /></button>
          <button className="icon-btn" onClick={() => setCurrentView('dialpad')}><Grip size={18} /></button>
          <button className="icon-btn" onClick={() => setCurrentView('contacts')}><BookUser size={18} /></button>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setShowPlusMenu(!showPlusMenu)}>
            <Plus size={20} />
          </button>
          {showPlusMenu && (
            <div className="plus-menu" style={{ position: 'absolute', top: '100%', right: '0', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px 0', zIndex: 100, minWidth: '150px', boxShadow: 'var(--shadow-md)' }}>
              <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '8px 16px', color: 'var(--text-primary)', backgroundColor: 'transparent', fontWeight: 'normal' }} onClick={() => { onNewChat(); setShowPlusMenu(false); }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>New Chat</button>
              <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '8px 16px', color: 'var(--text-primary)', backgroundColor: 'transparent', fontWeight: 'normal' }} onClick={() => { onNewGroup(); setShowPlusMenu(false); }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>New Group</button>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-user-section">
        <div className="user-profile-btn" onClick={onProfileClick} style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
          <div className="avatar-container" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              getInitials(currentUser.name)
            )}
            <div className={`status-indicator status-${currentUser.status}`} style={{ width: '12px', height: '12px' }}></div>
          </div>
          <div className="contact-info">
            <div className="contact-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {currentUser.name}
              {currentUser.role === 'admin' && <span title="Skycord Administrator" style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>👑</span>}
            </div>
          </div>
        </div>
        <div className="user-balance" title="Balance to make calls or buy themes" style={{ cursor: 'pointer' }} onClick={() => alert('Balance features coming soon!')}>$17.50</div>
      </div>
      
      <div className="search-bar">
        <div className="search-input-container">
          <input 
            type="text" 
            placeholder="Search or add u/username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <Search size={16} />
        </div>
      </div>

      <div className="recent-header">
        <div className="recent-header-left">
          <Clock size={14} />
          <span>Recent ⌄</span>
        </div>
        {totalUnread > 0 && <div className="badge-orange">{totalUnread}</div>}
      </div>
      
      <div className="contact-list">
        {filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <div 
              key={contact.id} 
              className={`contact-item ${contact.id === activeContactId ? 'active' : ''}`}
              onClick={() => onSelectContact(contact.id)}
            >
              <div className="avatar-container">
                {contact.avatarUrl ? (
                  <img src={contact.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : contact.isGroup ? (
                  <Users size={20} color="var(--text-secondary)" />
                ) : (
                  getInitials(contact.name)
                )}
                {!contact.isGroup && (
                  <div className={`status-indicator status-${contact.status}`}></div>
                )}
              </div>
              <div className="contact-info">
                <div className="contact-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {contact.name}
                  {contact.role === 'admin' && <span title="Skycord Administrator" style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>👑</span>}
                </div>
                <div className="contact-status-text">{contact.lastMsg}</div>
              </div>
              {unreadCounts[String(contact.id)] > 0 && <div className="badge-orange" style={{ marginLeft: 'auto' }}>{unreadCounts[String(contact.id)]}</div>}
            </div>
          ))
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No contacts found
          </div>
        )}
      </div>
      
      <div className="sidebar-footer">
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', position: 'relative' }}>
          <button className="icon-btn" onClick={onSettingsClick} title="Options"><Settings size={18} /></button>
          <button className="icon-btn" onClick={() => setShowMoreMenu(!showMoreMenu)}><MoreHorizontal size={18} /></button>
          {showMoreMenu && (
            <div style={{ position: 'absolute', bottom: '100%', right: '0', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px 0', zIndex: 100, minWidth: '150px', boxShadow: 'var(--shadow-md)', marginBottom: '8px' }}>
              <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '8px 16px', color: 'var(--text-primary)', backgroundColor: 'transparent', fontWeight: 'normal' }} onClick={() => { alert('Tips and Tricks coming soon!'); setShowMoreMenu(false); }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Tips and Tricks</button>
              <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '8px 16px', color: 'var(--danger)', backgroundColor: 'transparent', fontWeight: 'normal' }} onClick={() => { onSignOut(); setShowMoreMenu(false); }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Sign Out</button>
            </div>
          )}
        </div>
      </div>

      {showFriendRequest && (
        <FriendRequestModal 
          targetUsername={targetUser}
          onClose={() => setShowFriendRequest(false)}
          onSubmit={async (username, message) => {
            const { data: targetProfile } = await supabase.from('profiles').select('id').eq('username', username).single();
            if (targetProfile) {
              const { data: sessionData } = await supabase.auth.getSession();
              const myId = sessionData.session?.user.id;
              if (myId) {
                const { error } = await supabase.from('relationships').insert({
                  user_id: myId,
                  friend_id: targetProfile.id,
                  status: 'pending',
                  intro_message: message
                });
                if (error) alert('Error sending request: ' + error.message);
                else alert('Friend request sent!');
              }
            } else {
              alert('User not found!');
            }
            setShowFriendRequest(false);
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}
