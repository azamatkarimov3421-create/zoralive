export function calculateLevel(xp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  // Smooth progressive curve similar to Ziigo / Bigo Live
  let level = 1;
  let threshold = 100;
  let prevThreshold = 0;

  while (safeXp >= threshold && level < 100) {
    level++;
    prevThreshold = threshold;
    threshold += level * 150;
  }

  const span = Math.max(1, threshold - prevThreshold);
  const progress = Math.min(100, Math.round(((safeXp - prevThreshold) / span) * 100));

  return {
    level,
    currentXp: safeXp,
    nextLevelXp: threshold,
    progress,
  };
}

export function sanitizeUser(row: Record<string, any>) {
  if (!row) return null;
  const wealth = calculateLevel(row.wealth_xp);
  const charm = calculateLevel(row.charm_xp);
  return {
    id: row.id,
    uid: row.uid,
    username: row.username,
    displayName: row.display_name,
    avatar: row.avatar,
    bio: row.bio || '',
    country: row.country || 'UZ',
    gender: row.gender || 'other',
    role: row.role,
    coins: row.coins,
    diamonds: row.diamonds,
    wealthXp: row.wealth_xp,
    charmXp: row.charm_xp,
    wealthLevel: wealth.level,
    wealthProgress: wealth.progress,
    wealthNextXp: wealth.nextLevelXp,
    charmLevel: charm.level,
    charmProgress: charm.progress,
    charmNextXp: charm.nextLevelXp,
    vipLevel: row.vip_level || 0,
    vipExpiresAt: row.vip_expires_at || null,
    activeFrame: row.active_frame || '',
    activeRide: row.active_ride || '',
    activeBubble: row.active_bubble || '',
    agencyId: row.agency_id || null,
    isBanned: Boolean(row.is_banned),
    hostedMinutes: row.hosted_minutes || 0,
    createdAt: row.created_at,
  };
}
