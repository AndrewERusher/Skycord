import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import HomeView from './components/HomeView';
import DialpadView from './components/DialpadView';
import ContactsView from './components/ContactsView';
import CallView from './components/CallView';
import NewChatModal from './components/NewChatModal';
import AuthView from './components/AuthView';
import IncomingCallModal from './components/IncomingCallModal';
import { supabase } from './lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import './App.css';

// Mock data
export const INITIAL_MOCK_CONTACTS = [
  { id: 1, name: 'Design Team', status: 'online', isGroup: true, lastMsg: 'Looks great!' },
  { id: 2, name: 'Sarah Connor', status: 'online', isGroup: false, lastMsg: 'I will be there.' },
  { id: 3, name: 'John Smith', status: 'away', isGroup: false, lastMsg: 'In a meeting' },
  { id: 4, name: 'Marketing Sync', status: 'offline', isGroup: true, lastMsg: 'Scheduled for tomorrow' },
  { id: 5, name: 'Emma Wilson', status: 'dnd', isGroup: false, lastMsg: 'Do not disturb' },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [activeContactId, setActiveContactId] = useState<string | number>(2);
  const [joinGroupTarget, setJoinGroupTarget] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'rusher'>(() => {
    return (localStorage.getItem('theme') as any) || 'light';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contacts, setContacts] = useState(INITIAL_MOCK_CONTACTS);
  const [currentView, setCurrentView] = useState<'chat' | 'home' | 'dialpad' | 'contacts' | 'call'>('chat');
  const [session, setSession] = useState<Session | null>(null);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [callRole, setCallRole] = useState<'caller' | 'callee'>('caller');
  const [incomingCall, setIncomingCall] = useState<{contact: any, type: 'video' | 'audio'} | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setCurrentUser({
        id: data.id,
        name: data.display_name,
        username: data.username,
        status: data.status,
        bio: data.bio || '',
        avatarUrl: data.avatar_url || '',
        role: data.role || 'user',
        firstName: data.first_name || '',
        middleName: data.middle_name || '',
        lastName: data.last_name || '',
        country: data.country || '',
        state: data.state || '',
        city: data.city || '',
        zipcode: data.zipcode || '',
        privacySettings: data.privacy_settings || { firstName: 'private', middleName: 'private', lastName: 'private', country: 'private', state: 'private', city: 'private', zipcode: 'private' },
        isVerified: data.is_verified || false,
        idImageUrl: data.id_image_url || ''
      });
    }
  };

  const fetchContacts = async (myId: string) => {
    // 1. Fetch friends instead of all users
    const { data: myFriendsData } = await supabase
      .from('relationships')
      .select('friend_id, user_id, status')
      .or(`user_id.eq.${myId},friend_id.eq.${myId}`)
      .eq('status', 'accepted');
      
    let friendIds = new Set<string>();
    if (myFriendsData) {
      myFriendsData.forEach(rel => {
        if (rel.user_id !== myId) friendIds.add(rel.user_id);
        if (rel.friend_id !== myId) friendIds.add(rel.friend_id);
      });
    }

    // Always include AndrewRusher and Skycord automatically (case-insensitive)
    const { data: globalUsers } = await supabase
      .from('profiles')
      .select('id')
      .or('username.ilike.AndrewRusher,username.ilike.Skycord');
      
    if (globalUsers) {
      globalUsers.forEach(u => friendIds.add(u.id));
    }
    
    // Remove self from friends list if somehow added
    friendIds.delete(myId);
    
    const finalFriendIds = Array.from(friendIds);
    let mappedUsers: any[] = [];
    
    if (finalFriendIds.length > 0) {
      const { data: users } = await supabase.from('profiles').select('*').in('id', finalFriendIds);
      if (users) {
        mappedUsers = users.map((p: any) => ({
          id: p.id,
          name: p.display_name,
          status: p.status || 'offline',
          isGroup: false,
          lastMsg: p.role === 'admin' ? 'Skycord Administrator' : 'Available to chat!',
          avatarUrl: p.avatar_url,
          role: p.role || 'user'
        }));
      }
    }

    // 2. Fetch my groups
    const { data: memberships } = await supabase.from('conversation_members').select('conversation_id, conversations(id, name, avatar_url, is_group, parent_group_id)').eq('user_id', myId);
    let mappedGroups: any[] = [];
    if (memberships) {
      mappedGroups = memberships
        .filter(m => m.conversations && (m.conversations as any).is_group)
        .map(m => {
          const conv = m.conversations as any;
          return {
            id: conv.id,
            name: conv.name || 'Unnamed Group',
            status: 'online',
            isGroup: true,
            lastMsg: 'Group Chat',
            avatarUrl: conv.avatar_url,
            parentGroupId: conv.parent_group_id
          };
        });

      // Second pass to determine chat type and subtitle
      mappedGroups = mappedGroups.map(g => {
        if (g.parentGroupId) {
          const parent = mappedGroups.find(p => p.id === g.parentGroupId);
          const parentName = parent ? parent.name : 'Unknown';
          return { 
            ...g, 
            chatType: 'subgroup',
            parentName,
            lastMsg: `Subgroup of ${parentName}`
          };
        } else {
          const hasSubgroups = mappedGroups.some(sub => sub.parentGroupId === g.id);
          return {
            ...g,
            chatType: hasSubgroups ? 'main' : 'group',
            lastMsg: hasSubgroups ? 'Main Chat' : 'Group Chat'
          };
        }
      });
    }

    const allContacts = [...mappedGroups, ...mappedUsers];
    setContacts(allContacts);
    if (allContacts.length > 0 && activeContactId === 2) {
      setActiveContactId(allContacts[0].id);
    }
  };

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthenticated(!!session);
      if (session) {
        fetchProfile(session.user.id);
        fetchContacts(session.user.id);
      }
    });

    // Subscribe to auth changes (like login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
      if (session) {
        fetchProfile(session.user.id);
        fetchContacts(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle fullscreen on CTRL + F
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.warn(`Error attempting to enable fullscreen: ${err.message}`);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      }
      // Note: Browsers handle ESC to exit fullscreen automatically by default.
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [currentUser, setCurrentUser] = useState<any>({
    id: '',
    name: 'Loading...',
    username: '...',
    status: 'online',
    bio: '',
    avatarUrl: '',
    role: 'user',
    firstName: '',
    middleName: '',
    lastName: '',
    country: '',
    state: '',
    city: '',
    zipcode: '',
    privacySettings: { firstName: 'private', middleName: 'private', lastName: 'private', country: 'private', state: 'private', city: 'private', zipcode: 'private' },
    isVerified: false,
    idImageUrl: ''
  });

  // WebRTC Signaling Listener for Incoming Calls
  useEffect(() => {
    if (!isAuthenticated || !currentUser.id) return;

    const signalChannel = supabase.channel(`user_signals:${currentUser.id}`);
    
    signalChannel.on('broadcast', { event: 'incoming_call' }, ({ payload }: any) => {
      const contact = {
        id: payload.callerId,
        name: payload.callerName,
        status: 'online',
        isGroup: false,
        lastMsg: '',
        avatarUrl: payload.callerAvatar
      };
      setIncomingCall({ contact, type: payload.type });
    });

    // Also listen for call_ended to dismiss the modal if they hang up before we answer
    signalChannel.on('broadcast', { event: 'call_ended' }, () => {
      setIncomingCall(null);
    });

    signalChannel.subscribe();

    return () => {
      supabase.removeChannel(signalChannel);
    };
  }, [isAuthenticated, currentUser.id]);

  const activeContact = contacts.length > 0 ? (contacts.find(c => c.id === activeContactId) || contacts[0]) : null;

  const handleSaveProfile = async (updatedUser: any) => {
    setCurrentUser(updatedUser);
    if (session) {
      await supabase.from('profiles').update({
        display_name: updatedUser.name,
        bio: updatedUser.bio,
        status: updatedUser.status,
        avatar_url: updatedUser.avatarUrl,
        first_name: updatedUser.firstName,
        middle_name: updatedUser.middleName,
        last_name: updatedUser.lastName,
        country: updatedUser.country,
        state: updatedUser.state,
        city: updatedUser.city,
        zipcode: updatedUser.zipcode,
        privacy_settings: updatedUser.privacySettings,
        id_image_url: updatedUser.idImageUrl
      }).eq('id', session.user.id);
    }
  };

  const handleCreateChat = async (name: string, isGroup: boolean, selectedIds?: (string | number)[]) => {
    if (!isGroup && selectedIds && selectedIds.length === 1) {
      setActiveContactId(selectedIds[0]);
      setCurrentView('chat');
    } else if (isGroup && selectedIds && selectedIds.length > 0) {
      const { data: newGroup } = await supabase.from('conversations').insert({ is_group: true, name: name }).select().single();
      if (newGroup) {
        await supabase.from('conversation_members').insert({ conversation_id: newGroup.id, user_id: currentUser.id, group_role: 'admin' });
        for (const id of selectedIds) {
          await supabase.from('conversation_members').insert({ conversation_id: newGroup.id, user_id: id, group_role: 'member' });
        }
        if (session) fetchContacts(session.user.id);
        setActiveContactId(newGroup.id);
        setCurrentView('chat');
      }
    }
    setShowNewChat(false);
    setShowNewGroup(false);
  };

  if (!isAuthenticated) {
    return <AuthView onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-container">
      {!isFullscreen && (
        <Sidebar 
          onProfileClick={() => setShowProfile(true)} 
          onSettingsClick={() => setShowSettings(true)}
          currentUser={currentUser} 
          contacts={contacts}
          activeContactId={activeContactId}
          onSelectContact={(id) => {
            setActiveContactId(id);
            setCurrentView('chat');
          }}
          setCurrentView={setCurrentView}
          onNewChat={() => setShowNewChat(true)}
          onNewGroup={() => setShowNewGroup(true)}
          onJoinGroup={(group) => setJoinGroupTarget(group)}
          onSignOut={async () => {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }}
        />
      )}
      
      {currentView === 'chat' && activeContact && <ChatArea activeContact={activeContact} myId={currentUser.id} onStartCall={(type) => { 
        setCallType(type); 
        setCallRole('caller');
        setCurrentView('call'); 

        // Send a ring signal to the callee
        if (!activeContact.isGroup) {
          const signalChannel = supabase.channel(`temp_signal_${Date.now()}`);
          signalChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              signalChannel.send({
                type: 'broadcast',
                event: 'incoming_call',
                payload: {
                  callerId: currentUser.id,
                  callerName: currentUser.name,
                  callerAvatar: currentUser.avatarUrl,
                  type: type
                }
              }).then(() => supabase.removeChannel(signalChannel));
            }
          });
        }
      }} />}
      {currentView === 'chat' && !activeContact && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No contacts available. Find some friends!</div>}
      {currentView === 'home' && <HomeView />}
      {currentView === 'dialpad' && <DialpadView />}
      {currentView === 'contacts' && <ContactsView contacts={contacts} onStartChat={(id) => { setActiveContactId(id); setCurrentView('chat'); }} />}
      {currentView === 'call' && <CallView contact={activeContact} type={callType} myId={currentUser.id} callRole={callRole} onEndCall={() => {
        // Send a call ended signal if we hang up
        if (activeContact && !activeContact.isGroup) {
          const signalChannel = supabase.channel(`temp_signal_end_${Date.now()}`);
          signalChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              signalChannel.send({
                type: 'broadcast',
                event: 'call_ended',
              }).then(() => supabase.removeChannel(signalChannel));
            }
          });
        }
        setCurrentView('chat');
      }} />}
      
      {incomingCall && (
        <IncomingCallModal 
          call={incomingCall} 
          onAccept={() => {
            setActiveContactId(incomingCall.contact.id);
            setCallType(incomingCall.type);
            setCallRole('callee');
            setCurrentView('call');
            setIncomingCall(null);
          }}
          onDecline={() => {
            setIncomingCall(null);
          }}
        />
      )}

      {showNewChat && (
        <NewChatModal 
          title="New Chat" 
          contacts={contacts}
          onClose={() => setShowNewChat(false)} 
          onCreate={handleCreateChat} 
        />
      )}
      {showNewGroup && (
        <NewChatModal 
          title="New Group" 
          contacts={contacts}
          onClose={() => setShowNewGroup(false)} 
          onCreate={handleCreateChat} 
        />
      )}

      {showProfile && (
        <ProfileModal 
          user={currentUser} 
          onClose={() => setShowProfile(false)} 
          onSave={handleSaveProfile}
        />
      )}

      {showSettings && (
        <SettingsModal 
          theme={theme}
          setTheme={setTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
      {joinGroupTarget && (
        <div className="modal-overlay animate-fade-in" onClick={() => setJoinGroupTarget(null)}>
          <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '420px' }}>
            <div className="modal-header">
              <h2>Join Group</h2>
              <button className="icon-btn" onClick={() => setJoinGroupTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Would you like to join <strong>{joinGroupTarget.name}</strong>?
                {joinGroupTarget.chatType === 'main' && ' This group has subgroups you can explore after joining.'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setJoinGroupTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                if (!session) return;
                const { error } = await supabase.from('conversation_members').insert({
                  conversation_id: joinGroupTarget.id,
                  user_id: session.user.id,
                  group_role: 'member'
                });
                if (error) alert('Could not join group: ' + error.message);
                else {
                  fetchContacts(session.user.id);
                  setActiveContactId(joinGroupTarget.id);
                  setCurrentView('chat');
                }
                setJoinGroupTarget(null);
              }}>Join Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

