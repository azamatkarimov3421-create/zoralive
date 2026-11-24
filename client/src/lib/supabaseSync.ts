import { supabase, isSupabaseConfigured } from './supabase';
import { User, RoomSummary, GiftItem } from '../types';

// ==============================================================================
// 1. FOYDALANUVCHILAR VA PROFIL (PROFILES)
// ==============================================================================

export async function fetchProfileFromSupabase(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return mapDbUser(data);
  } catch (e) {
    console.warn('Failed to fetch profile from Supabase:', e);
    return null;
  }
}

export async function fetchAllProfilesFromSupabase(): Promise<User[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('vip_level', { ascending: false });

    if (error || !data) return [];
    return data.map(mapDbUser);
  } catch (e) {
    console.warn('Failed to fetch all profiles:', e);
    return [];
  }
}

export async function syncProfileToSupabase(profile: Partial<User> & { id: string }) {
  if (!isSupabaseConfigured) return;
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (profile.displayName !== undefined) payload.display_name = profile.displayName;
    if (profile.username !== undefined) payload.username = profile.username;
    if (profile.bio !== undefined) payload.bio = profile.bio;
    if (profile.avatar !== undefined) payload.avatar = profile.avatar;
    if (profile.role !== undefined) payload.role = profile.role;
    if (profile.coins !== undefined) payload.coins = profile.coins;
    if (profile.diamonds !== undefined) payload.diamonds = profile.diamonds;
    if (profile.vipLevel !== undefined) payload.vip_level = profile.vipLevel;
    if ((profile as any).rankLevel !== undefined) payload.rank_level = (profile as any).rankLevel;
    if (profile.activeFrame !== undefined) payload.active_frame = profile.activeFrame;
    if (profile.activeRide !== undefined) payload.active_ride = profile.activeRide;
    if (profile.activeBubble !== undefined) payload.active_bubble = profile.activeBubble;
    if (profile.followersCount !== undefined) payload.followers_count = profile.followersCount;
    if (profile.followingCount !== undefined) payload.following_count = profile.followingCount;

    await supabase.from('profiles').update(payload).eq('id', profile.id);
  } catch (e) {
    console.warn('Failed to sync profile to Supabase:', e);
  }
}

export async function registerOrLoginUser(username: string, displayName?: string): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const cleanUser = username.trim().toLowerCase();
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', cleanUser)
      .maybeSingle();

    if (existing) {
      return mapDbUser(existing);
    }

    const newId = `user_${Date.now()}`;
    const newUid = Math.floor(Math.random() * 800000) + 100000;
    const cleanDisplayName = (displayName || username).trim();
    const { data: created, error } = await supabase
      .from('profiles')
      .insert({
        id: newId,
        uid: newUid,
        username: cleanUser,
        display_name: cleanDisplayName,
        avatar: '',
        bio: 'ZoraLive a’zosi',
        coins: 5000,
        diamonds: 0,
        vip_level: 0,
        rank_level: 1,
        active_frame: '',
        active_ride: '',
        active_bubble: '',
        followers_count: 0,
        following_count: 0,
      })
      .select()
      .single();

    if (error || !created) return null;
    return mapDbUser(created);
  } catch (e) {
    console.warn('Failed to register/login in Supabase:', e);
    return null;
  }
}

export function mapDbUser(data: any): User {
  const vip = Number(data.vip_level) || 0;
  const coins = Number(data.coins) || 0;
  const diamonds = Number(data.diamonds) || 0;
  const wealthXp = vip > 0 ? vip * 3000 + Math.floor(coins / 10) : Math.max(0, Math.floor(coins / 25));
  const charmXp = vip > 0 ? vip * 1800 + diamonds * 2 : diamonds * 2;
  const wealthLevel = Math.max(1, Math.min(50, Math.floor(wealthXp / 1500) + 1));
  const charmLevel = Math.max(1, Math.min(50, Math.floor(charmXp / 1200) + 1));

  return {
    id: data.id,
    uid: Number(data.uid) || 100888,
    username: data.username || `user_${data.uid || 100000}`,
    displayName: data.display_name || data.username || 'Foydalanuvchi',
    avatar: data.avatar || '',
    bio: data.bio || '',
    country: data.country || 'UZ',
    gender: (data.gender as any) || 'other',
    role: (data.role as any) || 'USER',
    coins,
    diamonds,
    wealthXp,
    charmXp,
    wealthLevel,
    wealthProgress: Math.min(100, Math.round(((wealthXp % 1500) / 1500) * 100)),
    wealthNextXp: wealthLevel * 1500,
    charmLevel,
    charmProgress: Math.min(100, Math.round(((charmXp % 1200) / 1200) * 100)),
    charmNextXp: charmLevel * 1200,
    vipLevel: vip,
    vipExpiresAt: null,
    activeFrame: data.active_frame ?? '',
    activeRide: data.active_ride ?? '',
    activeBubble: data.active_bubble ?? '',
    agencyId: data.agency_id || null,
    isBanned: Boolean(data.is_banned),
    hostedMinutes: Number(data.hosted_minutes) || 0,
    followersCount: Number(data.followers_count) || 0,
    followingCount: Number(data.following_count) || 0,
  };
}

// ==============================================================================
// 2. JONLI EFIR XONALARI (ROOMS)
// ==============================================================================

export async function fetchRoomsFromSupabase(): Promise<RoomSummary[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    let { data, error } = await supabase
      .from('rooms')
      .select('*, profiles:host_id(*)')
      .eq('is_live', true)
      .order('viewer_count', { ascending: false });

    if (error || !data) {
      const fallback = await supabase.from('rooms').select('*').eq('is_live', true);
      data = fallback.data;
    }

    if (!data || data.length === 0) return null;

    return data.map((r: any, idx: number) => {
      const cat = String(r.category || '').toUpperCase();
      const rType: 'VOICE' | 'VIDEO' | 'GAME' =
        cat === 'VIDEO' ? 'VIDEO' : cat === 'GAME' ? 'GAME' : 'VOICE';
      return {
        id: r.id,
        roomNumber: 8801 + idx,
        title: r.title,
        type: rType,
        theme: 'light',
        cover: r.cover_image || r.profiles?.avatar || '/assets/stage-palace.jpg',
        country: r.profiles?.country || 'UZ',
        hostId: r.host_id,
        hostName: r.profiles?.display_name || 'Efir boshlovchisi',
        hostAvatar: r.profiles?.avatar || '',
        hostFrame: r.profiles?.active_frame ?? '',
        hostVip: Number(r.profiles?.vip_level) || 0,
        hostUid: Number(r.profiles?.uid) || 100222,
        seatCount: rType === 'VIDEO' ? 4 : 8,
        isLive: Boolean(r.is_live),
        isFeatured: true,
        totalGifts: Number(r.total_diamonds) || 0,
        viewerCount: Math.max(1, Number(r.viewer_count) || 1),
        hasPk: false,
        occupiedSeats: 1,
      };
    });
  } catch (e) {
    console.warn('Failed to fetch rooms from Supabase:', e);
    return null;
  }
}

export async function createRoomInSupabase(
  hostUser: User,
  title: string,
  category = 'VOICE',
  customRoomId?: string
): Promise<RoomSummary | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const roomId = customRoomId || `room_${Date.now()}`;
    const rType: 'VOICE' | 'VIDEO' | 'GAME' =
      category === 'VIDEO' ? 'VIDEO' : category === 'GAME' ? 'GAME' : 'VOICE';
    const { data, error } = await supabase
      .from('rooms')
      .upsert({
        id: roomId,
        host_id: hostUser.id,
        title: title || `${hostUser.displayName} xonasi`,
        category: rType,
        cover_image: hostUser.avatar || '/assets/stage-palace.jpg',
        is_live: true,
        viewer_count: 1,
        total_diamonds: 0,
      })
      .select('*, profiles:host_id(*)')
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      roomNumber: Math.floor(Math.random() * 8000) + 1000,
      title: data.title,
      type: rType,
      theme: 'light',
      cover: data.cover_image || '/assets/stage-palace.jpg',
      country: hostUser.country || 'UZ',
      hostId: hostUser.id,
      hostName: hostUser.displayName,
      hostAvatar: hostUser.avatar,
      hostFrame: hostUser.activeFrame || '',
      hostVip: hostUser.vipLevel || 0,
      hostUid: hostUser.uid,
      seatCount: rType === 'VIDEO' ? 4 : 8,
      isLive: true,
      isFeatured: true,
      totalGifts: 0,
      viewerCount: 1,
      hasPk: false,
      occupiedSeats: 1,
    };
  } catch (e) {
    console.warn('Failed to create room in Supabase:', e);
    return null;
  }
}

export async function closeRoomInSupabase(roomId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('rooms').update({ is_live: false }).eq('id', roomId);
  } catch (e) {
    console.warn('Failed to close room in Supabase:', e);
  }
}

// ==============================================================================
// 3. JONLI CHAT VA XABARLAR (ROOM MESSAGES + REALTIME)
// ==============================================================================

export async function fetchRoomMessagesFromSupabase(roomId: string) {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(60);

    if (error || !data) return [];
    return data;
  } catch (e) {
    console.warn('Failed to fetch room messages:', e);
    return [];
  }
}

export async function sendRoomMessageToSupabase(
  roomId: string,
  user: User,
  content: string,
  messageType = 'CHAT',
  giftId?: string,
  giftCount = 1
) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('room_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        user_name: user.displayName,
        user_avatar: user.avatar,
        vip_level: user.vipLevel || 0,
        badge: user.vipLevel >= 12 ? 'SVIP12' : user.vipLevel >= 1 ? `VIP${user.vipLevel}` : '',
        content,
        message_type: messageType,
        gift_id: giftId || null,
        gift_count: giftCount,
      })
      .select()
      .single();

    if (error) return null;
    return data;
  } catch (e) {
    console.warn('Failed to send room message to Supabase:', e);
    return null;
  }
}

export function subscribeToRoomMessages(roomId: string, onMessage: (msg: any) => void) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`room_chat_${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onMessage(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ==============================================================================
// 4. SOVG'ALAR (GIFTS) VA HAMYON AMALLARI
// ==============================================================================

export async function fetchGiftsFromSupabase(): Promise<GiftItem[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('gifts_catalog')
      .select('*')
      .order('price_coins', { ascending: true });

    if (error || !data || data.length === 0) return null;

    return data.map((g: any) => ({
      id: g.id,
      name: g.name_uz,
      name_uz: g.name_uz,
      icon: g.icon_url,
      category: Number(g.price_coins) > 5000 ? 'LUXURY' : Number(g.price_coins) > 500 ? 'LUCKY' : 'BASIC',
      price: Number(g.price_coins),
      effect_type:
        g.animation_type === 'fullscreen' || g.animation_type === 'dragon_3d' || g.animation_type === 'cinematic'
          ? 'fullscreen'
          : 'burst',
      accent_color: '#f59e0b',
    }));
  } catch (e) {
    console.warn('Failed to fetch gifts from Supabase:', e);
    return null;
  }
}

export async function sendGiftInSupabase(
  sender: User,
  receiverId: string,
  gift: { id: string; nameUz: string; price: number; diamondsAward: number },
  count = 1,
  roomId?: string
): Promise<{ success: boolean; senderCoins: number; receiverDiamonds?: number }> {
  if (!isSupabaseConfigured) {
    return { success: true, senderCoins: Math.max(0, sender.coins - gift.price * count) };
  }
  try {
    const totalCost = gift.price * count;
    const totalDiamonds = gift.diamondsAward * count;

    if (sender.coins < totalCost) {
      return { success: false, senderCoins: sender.coins };
    }

    const newSenderCoins = sender.coins - totalCost;

    // 1. Sender coins yangilash
    await supabase.from('profiles').update({ coins: newSenderCoins }).eq('id', sender.id);

    // 2. Receiver diamonds yangilash
    const { data: receiver } = await supabase
      .from('profiles')
      .select('diamonds')
      .eq('id', receiverId)
      .maybeSingle();

    if (receiver) {
      const newDiamonds = (Number(receiver.diamonds) || 0) + totalDiamonds;
      await supabase.from('profiles').update({ diamonds: newDiamonds }).eq('id', receiverId);
    }

    // 3. Tranzaksiya yozish
    await supabase.from('gift_transactions').insert({
      room_id: roomId || null,
      sender_id: sender.id,
      receiver_id: receiverId,
      gift_id: gift.id,
      gift_count: count,
      total_coins: totalCost,
      total_diamonds: totalDiamonds,
    });

    // 4. Efir chatiga sovg'a xabari yuborish
    if (roomId) {
      await sendRoomMessageToSupabase(
        roomId,
        sender,
        `${sender.displayName} ${count}x ${gift.nameUz} sovg‘a qildi! 🎁✨`,
        'GIFT',
        gift.id,
        count
      );
    }

    return { success: true, senderCoins: newSenderCoins };
  } catch (e) {
    console.warn('Failed to send gift in Supabase:', e);
    return { success: false, senderCoins: sender.coins };
  }
}

// ==============================================================================
// 5. KLANLAR VA OILALAR (FAMILIES)
// ==============================================================================

export async function fetchFamiliesFromSupabase() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .order('level', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (e) {
    console.warn('Failed to fetch families from Supabase:', e);
    return [];
  }
}

export async function createFamilyInSupabase(name: string, tag: string, owner: User) {
  if (!isSupabaseConfigured) return null;
  try {
    const familyId = `clan_${Date.now()}`;
    const { data, error } = await supabase
      .from('families')
      .insert({
        id: familyId,
        name,
        tag,
        badge: '👑',
        owner_id: owner.id,
        member_count: 1,
        level: 1,
        total_diamonds: 0,
      })
      .select()
      .single();

    if (error || !data) return null;
    return data;
  } catch (e) {
    console.warn('Failed to create family in Supabase:', e);
    return null;
  }
}
