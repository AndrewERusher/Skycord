import { useState, useEffect, useRef } from 'react';
import { Phone, Video, MoreHorizontal, Send, Smile, Users, Paperclip, Settings } from 'lucide-react';
import GroupAdminModal from './GroupAdminModal';
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

interface ChatAreaProps {
  activeContact: Contact;
  myId: string;
  onStartCall: (type: 'video' | 'audio') => void;
}




const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.ceil((date.getDate() + firstDay) / 7);
};

const formatDateSeparator = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  
  // Reset time part to 0 for exact day difference calculation
  const dateZero = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffDays = Math.round((nowZero.getTime() - dateZero.getTime()) / (1000 * 60 * 60 * 24));
  
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const weekStr = `Week ${getWeekOfMonth(date)}`;

  if (diffDays === 0) {
    return dayName;
  } else if (diffDays < 30) {
    return `${dayName}, ${weekStr}`;
  } else if (diffDays < 365) {
    return `${monthName}, ${weekStr}, ${dayName}`;
  } else {
    return `${year}, ${monthName}, ${weekStr}, ${dayName}`;
  }
};

export default function ChatArea({ activeContact, myId, onStartCall }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showGroupAdmin, setShowGroupAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!myId || !activeContact?.id) return;
    
    // If it's a group, the activeContact.id IS the conversation ID
    if (activeContact.isGroup) {
      setConversationId(activeContact.id.toString());
      return;
    }

    if (typeof activeContact.id !== 'string') return;

    const initChat = async () => {
      const { data: myMemberships } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', myId);
      const { data: theirMemberships } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', activeContact.id);
      
      if (!myMemberships || !theirMemberships) return;

      const myConvIds = myMemberships.map(m => m.conversation_id);
      const theirConvIds = theirMemberships.map(m => m.conversation_id);
      const commonConvIds = myConvIds.filter(id => theirConvIds.includes(id));

      let currentConvId = null;

      if (commonConvIds.length > 0) {
        const { data: convs } = await supabase.from('conversations').select('id').in('id', commonConvIds).eq('is_group', false);
        if (convs && convs.length > 0) currentConvId = convs[0].id;
      }

      if (!currentConvId) {
        const { data: newConv } = await supabase.from('conversations').insert({ is_group: false }).select().single();
        if (newConv) {
          currentConvId = newConv.id;
          await supabase.from('conversation_members').insert([
            { conversation_id: currentConvId, user_id: myId },
            { conversation_id: currentConvId, user_id: activeContact.id }
          ]);
        }
      }

      setConversationId(currentConvId);
    };

    initChat();
  }, [activeContact?.id, activeContact?.isGroup, myId]);

  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          text: m.text,
          author: m.sender_id === myId ? 'You' : activeContact.name,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          isOutgoing: m.sender_id === myId
        })));
      }
    };

    loadMessages();

    const channel = supabase.channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
        const m = payload.new as any;
        // avoid duplicating optimistic messages
        setMessages(prev => {
          if (prev.find(msg => msg.text === m.text && msg.isOutgoing && m.sender_id === myId)) return prev;
          return [...prev, {
            id: m.id,
            text: m.text,
            author: m.sender_id === myId ? 'You' : activeContact.name,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            isOutgoing: m.sender_id === myId
          }];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, activeContact?.name, myId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;
    
    // Command interception: /push
    if (newMessage.trim() === '/push' && activeContact.isGroup) {
      // Check if user is admin
      const { data: memberCheck } = await supabase.from('conversation_members').select('group_role').eq('conversation_id', conversationId).eq('user_id', myId).single();
      
      // Global admin or group admin can push
      // Fetch subgroups
      const { data: subgroups } = await supabase.from('conversations').select('id, name').eq('parent_group_id', conversationId);
      
      if (subgroups && subgroups.length > 0) {
        const subgroup_ids = subgroups.map(g => g.id);
        const { data: submsgs } = await supabase.from('messages').select('*').in('conversation_id', subgroup_ids);
        
        if (submsgs && submsgs.length > 0) {
          // Copy messages to parent group
          const copies = submsgs.map(m => {
            const subgroupName = subgroups.find(g => g.id === m.conversation_id)?.name || 'Subgroup';
            return {
              conversation_id: conversationId,
              sender_id: m.sender_id,
              text: `[Forwarded from ${subgroupName}]: ${m.text}`
            };
          });
          
          await supabase.from('messages').insert(copies);
          setNewMessage('');
          return;
        }
      }
      setNewMessage('');
      return; // Stop normal execution for command
    }

    const optimisticMsg = {
      id: Date.now(),
      author: 'You',
      text: newMessage,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      isOutgoing: true
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: myId,
      text: optimisticMsg.text
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && conversationId) {
      const file = e.target.files[0];
      const optimisticMsg = {
        id: Date.now(),
        author: 'You',
        text: `[Attachment]: ${file.name}`,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        isOutgoing: true
      };
      setMessages(prev => [...prev, optimisticMsg]);
      
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: myId,
        text: optimisticMsg.text
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="avatar-container" style={{ width: '48px', height: '48px' }}>
            {activeContact.avatarUrl ? (
              <img src={activeContact.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : activeContact.isGroup ? (
              <Users size={24} color="var(--text-secondary)" />
            ) : (
              activeContact.name.substring(0, 2).toUpperCase()
            )}
            {!activeContact.isGroup && (
              <div className={`status-indicator status-${activeContact.status}`}></div>
            )}
          </div>
          <div className="chat-header-text">
            <div className="chat-header-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {activeContact.name}
              {activeContact.role === 'admin' && <span title="Skycord Administrator" style={{ color: 'var(--accent-primary)', fontSize: '1rem' }}>👑</span>}
            </div>
            <div className="chat-header-status">
              <span style={{ color: activeContact.status === 'dnd' ? 'var(--danger)' : 'inherit' }}>
                {activeContact.isGroup ? activeContact.lastMsg : activeContact.status === 'dnd' ? 'Busy!' : activeContact.status.charAt(0).toUpperCase() + activeContact.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="chat-actions">
          <button className="icon-btn primary" onClick={() => onStartCall('video')}><Video size={18} /></button>
          <button className="icon-btn primary" onClick={() => onStartCall('audio')}><Phone size={18} /></button>
          <button className="icon-btn" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }} onClick={() => activeContact.isGroup ? setShowGroupAdmin(true) : alert('Chat Settings coming soon!')} title={activeContact.isGroup ? "Group Settings" : "Chat Settings"}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {showGroupAdmin && activeContact.isGroup && conversationId && (
        <GroupAdminModal 
          groupId={conversationId} 
          myId={myId} 
          onClose={() => setShowGroupAdmin(false)} 
        />
      )}
      
      <div className="messages-container">
        {messages.length > 0 && (
          <div className="date-separator">{formatDateSeparator(messages[0].timestamp)} ⌄</div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`message-wrapper ${msg.isOutgoing ? 'outgoing' : ''} animate-slide-up`}>
            <div className="message-content-container">
              {!msg.isOutgoing && (
                <div className="avatar-container" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                  {msg.author.substring(0, 2).toUpperCase()}
                </div>
              )}
              
              <div className="message-content">
                {msg.text}
              </div>
              <div className="message-time">{msg.time}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input 
            type="text" 
            className="chat-input" 
            placeholder="Type a message here" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="chat-input-actions">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <button className="icon-btn" onClick={() => fileInputRef.current?.click()} style={{ padding: '4px', color: 'var(--accent-primary)' }}><Paperclip size={20} /></button>
            <button className="icon-btn" onClick={() => setNewMessage(newMessage + ' 😊')} style={{ padding: '4px', color: 'var(--accent-primary)' }}><Smile size={20} /></button>
            <button 
              className="icon-btn primary" 
              style={{ padding: '8px' }}
              onClick={handleSendMessage}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
