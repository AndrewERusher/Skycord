import { useState, useEffect } from 'react';
import { X, Shield, ShieldAlert, MicOff, UserMinus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface GroupAdminModalProps {
  groupId: string;
  myId: string;
  onClose: () => void;
}

export default function GroupAdminModal({ groupId, myId, onClose }: GroupAdminModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [subGroups, setSubGroups] = useState<any[]>([]);
  const [newSubGroupName, setNewSubGroupName] = useState('');
  const [amIAdmin, setAmIAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch members and their roles
    const { data: membersData } = await supabase
      .from('conversation_members')
      .select('user_id, group_role, is_muted, is_banned, profiles(id, display_name, avatar_url, username)')
      .eq('conversation_id', groupId);

    if (membersData) {
      setMembers(membersData.filter(m => !m.is_banned)); // don't show banned in active list
      
      const me = membersData.find(m => m.user_id === myId);
      if (me && me.group_role === 'admin') {
        setAmIAdmin(true);
      }
    }

    // Fetch sub-groups
    const { data: subsData } = await supabase
      .from('conversations')
      .select('id, name')
      .eq('parent_group_id', groupId);

    if (subsData) {
      setSubGroups(subsData);
    }

    setLoading(false);
  };

  const handleAction = async (targetUserId: string, action: 'promote' | 'mute' | 'unmute' | 'kick' | 'ban') => {
    if (!amIAdmin) return;
    
    let updateObj = {};
    if (action === 'promote') updateObj = { group_role: 'admin' };
    if (action === 'mute') updateObj = { is_muted: true };
    if (action === 'unmute') updateObj = { is_muted: false };
    if (action === 'ban') updateObj = { is_banned: true };

    if (action === 'kick') {
      await supabase.from('conversation_members').delete().eq('conversation_id', groupId).eq('user_id', targetUserId);
    } else {
      await supabase.from('conversation_members').update(updateObj).eq('conversation_id', groupId).eq('user_id', targetUserId);
    }

    fetchData(); // Refresh UI
  };

  const handleCreateSubGroup = async () => {
    if (!newSubGroupName.trim() || !amIAdmin) return;
    
    const { data: newGroup } = await supabase.from('conversations').insert({ 
      is_group: true, 
      name: newSubGroupName,
      parent_group_id: groupId 
    }).select().single();
    
    if (newGroup) {
      // Add all current members to the sub group automatically
      const memberInserts = members.map(m => ({
        conversation_id: newGroup.id,
        user_id: m.user_id,
        group_role: m.group_role
      }));
      await supabase.from('conversation_members').insert(memberInserts);
      
      setNewSubGroupName('');
      fetchData();
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 400 }}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ width: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2>Group Administration</h2>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading data...</div>
          ) : (
            <>
              {/* Sub-Groups Section */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Sub-Groups</h3>
                
                {subGroups.length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                    {subGroups.map(sub => (
                      <div key={sub.id} style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}># {sub.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>No sub-groups exist.</div>
                )}

                {amIAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      className="input-field" 
                      placeholder="New Sub-Group Name..." 
                      value={newSubGroupName}
                      onChange={e => setNewSubGroupName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-secondary" onClick={handleCreateSubGroup} disabled={!newSubGroupName.trim()}>
                      <Plus size={16} style={{ marginRight: '4px' }} /> Create
                    </button>
                  </div>
                )}
              </div>

              {/* Members Section */}
              <div>
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Members List</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {members.map(member => (
                    <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar-container" style={{ width: '36px', height: '36px' }}>
                          {member.profiles?.avatar_url ? (
                            <img src={member.profiles.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            member.profiles?.display_name?.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {member.profiles?.display_name}
                            {member.group_role === 'admin' && <span title="Group Admin" style={{ display: 'flex' }}><Shield size={14} color="var(--accent-primary)" /></span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>u/{member.profiles?.username} {member.is_muted ? '(Muted)' : ''}</div>
                        </div>
                      </div>
                      
                      {amIAdmin && member.user_id !== myId && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {member.group_role !== 'admin' && (
                            <button className="icon-btn" title="Promote to Admin" onClick={() => handleAction(member.user_id, 'promote')}>
                              <Shield size={16} />
                            </button>
                          )}
                          <button className="icon-btn" title={member.is_muted ? "Unmute User" : "Mute User"} onClick={() => handleAction(member.user_id, member.is_muted ? 'unmute' : 'mute')}>
                            <MicOff size={16} color={member.is_muted ? 'var(--danger)' : 'inherit'} />
                          </button>
                          <button className="icon-btn" title="Kick User" onClick={() => handleAction(member.user_id, 'kick')}>
                            <UserMinus size={16} />
                          </button>
                          <button className="icon-btn" title="Ban User" onClick={() => handleAction(member.user_id, 'ban')}>
                            <ShieldAlert size={16} color="var(--danger)" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
