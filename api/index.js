module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  // Auth demo
  if (url.includes('/auth/demo') || url.includes('/auth/login') || url.includes('/auth/register')) {
    return res.status(200).json({
      token: `demo_token_${Date.now()}`,
      user: {
        id: 'user_vip_1',
        uid: 100888,
        username: 'vip_mehmon',
        displayName: 'Abrorbek (VIP)',
        avatar: '/assets/avatar-abrorbek.jpg',
        bio: 'ZoraLive VIP foydalanuvchisi. Live suhbat va Ludo o‘yinlari!',
        country: 'UZ',
        gender: 'male',
        role: 'USER',
        coins: 25000,
        diamonds: 4200,
        wealthXp: 18000,
        charmXp: 12000,
        wealthLevel: 18,
        wealthProgress: 60,
        wealthNextXp: 25000,
        charmLevel: 14,
        charmProgress: 45,
        charmNextXp: 15000,
        vipLevel: 3,
        vipExpiresAt: null,
        activeFrame: 'frame_diamond',
        activeRide: 'ride_dragon',
        activeBubble: 'bubble_gold',
        agencyId: 'agency_tashkent',
        isBanned: false,
        hostedMinutes: 120,
        followersCount: 340,
        followingCount: 45,
      },
    });
  }

  if (url.includes('/auth/me')) {
    return res.status(200).json({
      user: {
        id: 'user_vip_1',
        uid: 100888,
        username: 'vip_mehmon',
        displayName: 'Abrorbek (VIP)',
        avatar: '/assets/avatar-abrorbek.jpg',
        role: 'USER',
        coins: 25000,
        diamonds: 4200,
        wealthLevel: 18,
        charmLevel: 14,
        vipLevel: 3,
      },
    });
  }

  return res.status(200).json({ ok: true, message: 'ZoraLive API Serverless Ready' });
};
