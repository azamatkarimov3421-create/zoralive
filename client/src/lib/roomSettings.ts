export interface RoomAccessSettings {
  maxCapacity: number;
  isLocked: boolean;
  password: string;
}

const KEY_PREFIX = 'zoralive_room_settings_';

export function getRoomSettings(roomId: string): RoomAccessSettings | null {
  if (!roomId) return null;
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${roomId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      maxCapacity: Math.max(2, Number(parsed.maxCapacity) || 8),
      isLocked: Boolean(parsed.isLocked),
      password: String(parsed.password || ''),
    };
  } catch {
    return null;
  }
}

export function saveRoomSettings(roomId: string, settings: RoomAccessSettings): void {
  if (!roomId) return;
  try {
    localStorage.setItem(`${KEY_PREFIX}${roomId}`, JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
}

export function clearRoomSettings(roomId: string): void {
  if (!roomId) return;
  try {
    localStorage.removeItem(`${KEY_PREFIX}${roomId}`);
  } catch {
    // ignore
  }
}
