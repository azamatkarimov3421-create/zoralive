import React, { useEffect, useRef, useState } from 'react';
import { Trophy, MessageCircle, Users, Send, ArrowLeft, Search, Heart, Image as ImageIcon, Flame } from 'lucide-react';
import { api } from '../lib/api';
import { fetchAllProfilesFromSupabase } from '../lib/supabaseSync';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Avatar } from '../components/Avatar';
import { PodiumCrown } from '../components/LuxuryBadges';

function compressImage(file: File, maxDim = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * ratio);
        cv.height = Math.round(img.height * ratio);
        cv.getContext('2d')?.drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const SocialPage: React.FC = () => {
  const { user, toast } = useAuth();
  const [section, setSection] = useState<'rank' | 'moments' | 'chat' | 'people'>('rank');
  const [rankType, setRankType] = useState<'wealth' | 'charm' | 'agency'>('wealth');
  const [rankUsers, setRankUsers] = useState<User[]>([]);
  const [rankAgencies, setRankAgencies] = useState<any[]>([]);

  // Moments state
  const [moments, setMoments] = useState<any[]>([]);
  const [postText, setPostText] = useState('');
  const [postImg, setPostImg] = useState('');
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');

  const [people, setPeople] = useState<User[]>([]);
  const [searchQ, setSearchQ] = useState('');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activePeer, setActivePeer] = useState<User | null>(null);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [dmInput, setDmInput] = useState('');
  const dmEndRef = useRef<HTMLDivElement>(null);

  const loadRank = async () => {
    if (rankType === 'agency') {
      const res = await api<any>(`/users/leaderboard?type=agency`);
      setRankAgencies(res.agencies || []);
      return;
    }
    const [res, supaUsers] = await Promise.all([
      api<any>(`/users/leaderboard?type=${rankType}`).catch(() => ({ users: [] })),
      fetchAllProfilesFromSupabase().catch(() => [] as User[]),
    ]);
    const map = new Map<string, User>();
    for (const u of [...supaUsers, ...(res.users || [])]) {
      if (!map.has(u.id)) map.set(u.id, u);
    }
    const sorted = Array.from(map.values()).sort((a, b) =>
      rankType === 'charm' ? b.charmXp - a.charmXp : b.wealthXp - a.wealthXp
    );
    setRankUsers(sorted);
  };

  const loadMoments = async () => {
    const res = await api<{ moments: any[] }>('/moments');
    setMoments(res.moments || []);
  };

  const loadPeople = async (q = '') => {
    const [res, supaUsers] = await Promise.all([
      api<{ users: User[] }>(`/users/directory?q=${encodeURIComponent(q)}`).catch(() => ({ users: [] as User[] })),
      fetchAllProfilesFromSupabase().catch(() => [] as User[]),
    ]);
    const ql = q.trim().toLowerCase();
    const map = new Map<string, User>();
    for (const u of [...supaUsers, ...(res.users || [])]) {
      if (u.id === user?.id) continue;
      if (
        ql &&
        !u.displayName.toLowerCase().includes(ql) &&
        !u.username.toLowerCase().includes(ql) &&
        !String(u.uid).includes(ql)
      ) {
        continue;
      }
      if (!map.has(u.id)) map.set(u.id, u);
    }
    setPeople(Array.from(map.values()));
  };

  const loadConversations = async () => {
    const res = await api<{ conversations: any[] }>('/messages/conversations');
    setConversations(res.conversations || []);
  };

  const openChat = async (peer: User) => {
    setSection('chat');
    setActivePeer(peer);
    const res = await api<{ messages: any[] }>(`/messages/${peer.id}`);
    setDmMessages(res.messages || []);
  };

  useEffect(() => {
    if (section === 'rank') loadRank().catch(() => {});
    if (section === 'moments') loadMoments().catch(() => {});
    if (section === 'people') loadPeople(searchQ).catch(() => {});
    if (section === 'chat') loadConversations().catch(() => {});
  }, [section, rankType]);

  useEffect(() => {
    dmEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dmMessages.length]);

  useEffect(() => {
    const socket = getSocket();
    const onDm = (msg: any) => {
      if (
        activePeer &&
        ((msg.sender_id === activePeer.id && msg.receiver_id === user?.id) ||
          (msg.sender_id === user?.id && msg.receiver_id === activePeer.id))
      ) {
        setDmMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
      loadConversations().catch(() => {});
    };
    socket.on('dm:received', onDm);
    return () => {
      socket.off('dm:received', onDm);
    };
  }, [activePeer?.id, user?.id]);

  const sendDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmInput.trim() || !activePeer) return;
    getSocket().emit('dm:send', { receiverId: activePeer.id, content: dmInput });
    setDmInput('');
  };

  const toggleFollow = async (targetId: string) => {
    try {
      const res = await api<{ following: boolean }>(`/users/${targetId}/follow`, { method: 'POST' });
      setPeople((prev) => prev.map((p) => (p.id === targetId ? { ...p, isFollowing: res.following } : p)));
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const publishMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !postImg) return;
    try {
      await api('/moments', { method: 'POST', body: JSON.stringify({ content: postText, imageUrl: postImg }) });
      setPostText('');
      setPostImg('');
      loadMoments();
      toast('Post joylandi', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const toggleComments = async (id: string) => {
    if (openCommentsId === id) {
      setOpenCommentsId(null);
      return;
    }
    setOpenCommentsId(id);
    const res = await api<{ comments: any[] }>(`/moments/${id}/comments`);
    setCommentsMap((prev) => ({ ...prev, [id]: res.comments || [] }));
  };

  if (section === 'chat' && activePeer) {
    return (
      <div className="flex flex-col h-[calc(100vh-84px)] bg-transparent">
        <div className="p-3 bg-white/65 backdrop-blur-2xl border-b border-white/85 flex items-center gap-3">
          <button onClick={() => setActivePeer(null)} className="p-2 rounded-full bg-white/80 text-slate-700 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Avatar src={activePeer.avatar} name={activePeer.displayName} size="sm" frame={activePeer.activeFrame} />
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900 truncate">{activePeer.displayName}</div>
            <div className="text-[10px] text-emerald-600 font-semibold">Onlayn</div>
          </div>
        </div>

        <div className="flex-1 p-3.5 overflow-y-auto space-y-2 bg-transparent">
          {dmMessages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs shadow-2xs ${
                    mine
                      ? 'bg-[#ff3366] text-white rounded-br-xs'
                      : 'bg-white/75 backdrop-blur-xl border border-white/90 text-slate-900 rounded-bl-xs'
                  }`}
                >
                  <div>{m.content}</div>
                  <div className={`text-[9px] mt-0.5 text-right ${mine ? 'text-white/75' : 'text-slate-500'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={dmEndRef} />
        </div>

        <form onSubmit={sendDm} className="p-3 bg-white/65 backdrop-blur-2xl border-t border-white/85 flex gap-2">
          <input
            value={dmInput}
            onChange={(e) => setDmInput(e.target.value)}
            placeholder="Xabar..."
            className="flex-1 px-4 py-2 rounded-full bg-white/75 border border-white/90 text-xs text-slate-900 focus:outline-none"
          />
          <button type="submit" className="p-2.5 rounded-full btn-brand">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  const top3 = rankUsers.slice(0, 3);
  const restUsers = rankUsers.slice(3);
  const scoreOf = (u: User) => (rankType === 'charm' ? u.charmXp : u.wealthXp);

  return (
    <div className="bg-transparent min-h-full px-3.5 pt-3 pb-24 space-y-4">
      <div className="grid grid-cols-4 gap-1 bg-white/60 backdrop-blur-xl border border-white/90 p-1 rounded-2xl shadow-xs">
        {[
          { id: 'rank', label: 'Reyting', icon: Trophy },
          { id: 'moments', label: 'Lenta', icon: Flame },
          { id: 'chat', label: 'Chat', icon: MessageCircle },
          { id: 'people', label: 'Do‘st', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id as any)}
              className={`py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* RANKING */}
      {section === 'rank' && (
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {[
              ['wealth', 'Saxiylar'],
              ['charm', 'Yulduzlar'],
              ['agency', 'Agentlik'],
            ].map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setRankType(k as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition ${
                  rankType === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {rankType !== 'agency' && top3.length >= 3 && (
            <div className="grid grid-cols-3 items-end gap-2 pt-3">
              <div onClick={() => top3[1].id !== user?.id && openChat(top3[1])} className="flex flex-col items-center cursor-pointer">
                <PodiumCrown rank={2} />
                <Avatar src={top3[1].avatar} name={top3[1].displayName} size="md" frame="frame-cyber" vipLevel={top3[1].vipLevel} />
                <div className="mt-2.5 text-[11px] font-extrabold text-slate-900 truncate max-w-[92px]">{top3[1].displayName.split(' ')[0]}</div>
                <div className="text-[10px] font-bold text-slate-500 mb-1.5">{scoreOf(top3[1]).toLocaleString()}</div>
                <div className="w-full h-14 rounded-2xl podium-2 flex items-center justify-center text-lg font-black text-slate-600">2</div>
              </div>

              <div onClick={() => top3[0].id !== user?.id && openChat(top3[0])} className="flex flex-col items-center cursor-pointer -mt-3">
                <PodiumCrown rank={1} />
                <Avatar src={top3[0].avatar} name={top3[0].displayName} size="lg" frame="frame-gold" vipLevel={top3[0].vipLevel} />
                <div className="mt-2.5 text-xs font-black text-slate-900 truncate max-w-[100px]">{top3[0].displayName.split(' ')[0]}</div>
                <div className="text-[11px] font-extrabold text-amber-600 mb-1.5">{scoreOf(top3[0]).toLocaleString()}</div>
                <div className="w-full h-20 rounded-2xl podium-1 flex items-center justify-center text-2xl font-black text-amber-600">1</div>
              </div>

              <div onClick={() => top3[2].id !== user?.id && openChat(top3[2])} className="flex flex-col items-center cursor-pointer">
                <PodiumCrown rank={3} />
                <Avatar src={top3[2].avatar} name={top3[2].displayName} size="md" frame="frame-fire" vipLevel={top3[2].vipLevel} />
                <div className="mt-2.5 text-[11px] font-extrabold text-slate-900 truncate max-w-[92px]">{top3[2].displayName.split(' ')[0]}</div>
                <div className="text-[10px] font-bold text-slate-500 mb-1.5">{scoreOf(top3[2]).toLocaleString()}</div>
                <div className="w-full h-12 rounded-2xl podium-3 flex items-center justify-center text-lg font-black text-orange-600">3</div>
              </div>
            </div>
          )}

          {rankType === 'agency' ? (
            <div className="divide-y divide-slate-100 card-white rounded-2xl overflow-hidden">
              {rankAgencies.map((a, idx) => (
                <div key={a.id} className="px-3.5 py-3 flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-black text-slate-400">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 truncate">{a.name}</div>
                    <div className="text-[11px] text-slate-500">{a.code} • {a.host_count} host</div>
                  </div>
                  <span className="text-xs font-black text-amber-600">💎 {Number(a.total_earned).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 card-white rounded-2xl overflow-hidden">
              {restUsers.map((u, idx) => (
                <div key={u.id} className="px-3.5 py-2.5 flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-extrabold text-slate-400">{idx + 4}</span>
                  <Avatar src={u.avatar} name={u.displayName} size="sm" frame={u.activeFrame} vipLevel={u.vipLevel} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">{u.displayName}</div>
                    <div className="text-[10px] text-slate-400">ID: {u.uid}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">{scoreOf(u).toLocaleString()}</div>
                    {u.id !== user?.id && (
                      <button onClick={() => openChat(u)} className="text-[10px] font-bold text-[#ff3366]">
                        Yozish
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MOMENTS FEED (Lenta) */}
      {section === 'moments' && (
        <div className="space-y-3.5">
          <form onSubmit={publishMoment} className="card-white rounded-2xl p-3 space-y-2.5">
            <textarea
              rows={2}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Yangilik ulashing..."
              className="w-full resize-none bg-slate-50 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none"
            />
            {postImg && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                <img src={postImg} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPostImg('')}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px]"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Rasm</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setPostImg(await compressImage(f));
                  }}
                />
              </label>
              <button type="submit" className="px-4 py-1.5 rounded-full btn-brand text-xs font-extrabold">
                Joylash
              </button>
            </div>
          </form>

          {moments.map((m) => (
            <div key={m.id} className="card-white rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar src={m.avatar} name={m.displayName} size="sm" frame={m.frame} vipLevel={m.vipLevel} />
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{m.displayName}</div>
                  <div className="text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              {m.content && <p className="text-xs text-slate-800 leading-relaxed">{m.content}</p>}

              {m.imageUrl && (
                <div className="rounded-2xl overflow-hidden bg-slate-100 max-h-72">
                  <img src={m.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
                <button
                  onClick={async () => {
                    const res = await api<{ liked: boolean }>(`/moments/${m.id}/like`, { method: 'POST' });
                    setMoments((prev) =>
                      prev.map((item) =>
                        item.id === m.id
                          ? { ...item, liked: res.liked, likesCount: item.likesCount + (res.liked ? 1 : -1) }
                          : item
                      )
                    );
                  }}
                  className={`flex items-center gap-1 text-xs font-bold ${m.liked ? 'text-[#ff3366]' : 'text-slate-500'}`}
                >
                  <Heart className={`w-4 h-4 ${m.liked ? 'fill-current' : ''}`} />
                  <span>{m.likesCount}</span>
                </button>

                <button
                  onClick={() => toggleComments(m.id)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{m.commentsCount}</span>
                </button>
              </div>

              {openCommentsId === m.id && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {(commentsMap[m.id] || []).map((c) => (
                    <div key={c.id} className="text-xs bg-slate-50 rounded-xl px-3 py-1.5">
                      <span className="font-extrabold text-slate-900 mr-1.5">{c.display_name}:</span>
                      <span className="text-slate-700">{c.content}</span>
                    </div>
                  ))}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!commentText.trim()) return;
                      const res = await api<{ comment: any }>(`/moments/${m.id}/comments`, {
                        method: 'POST',
                        body: JSON.stringify({ content: commentText }),
                      });
                      setCommentsMap((prev) => ({ ...prev, [m.id]: [...(prev[m.id] || []), res.comment] }));
                      setMoments((prev) =>
                        prev.map((item) => (item.id === m.id ? { ...item, commentsCount: item.commentsCount + 1 } : item))
                      );
                      setCommentText('');
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Izoh..."
                      className="flex-1 px-3 py-1.5 rounded-full bg-slate-100 text-xs"
                    />
                    <button type="submit" className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold">
                      →
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CHAT INBOX */}
      {section === 'chat' && (
        <div className="divide-y divide-slate-100 card-white rounded-2xl overflow-hidden">
          {conversations.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">Xabarlar yo‘q</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.peer.id}
                onClick={() => openChat(c.peer)}
                className="w-full px-3.5 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition"
              >
                <Avatar src={c.peer.avatar} name={c.peer.displayName} size="sm" frame={c.peer.activeFrame} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 truncate">{c.peer.displayName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{c.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* DIRECTORY */}
      {section === 'people' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3.5 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={searchQ}
              onChange={(e) => {
                setSearchQ(e.target.value);
                loadPeople(e.target.value).catch(() => {});
              }}
              placeholder="Qidirish..."
              className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="divide-y divide-slate-100 card-white rounded-2xl overflow-hidden">
            {people.map((p) => (
              <div key={p.id} className="px-3.5 py-2.5 flex items-center gap-3">
                <Avatar src={p.avatar} name={p.displayName} size="sm" frame={p.activeFrame} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold text-slate-900 truncate">{p.displayName}</div>
                  <div className="text-[10px] text-slate-400">ID: {p.uid}</div>
                </div>
                <button onClick={() => openChat(p)} className="p-2 rounded-full bg-slate-100 text-slate-600">
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleFollow(p.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold ${
                    p.isFollowing ? 'bg-slate-100 text-slate-600' : 'btn-brand'
                  }`}
                >
                  {p.isFollowing ? 'Obunada' : 'Obuna'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
