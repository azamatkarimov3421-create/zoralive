export type RtcLinkStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting';

export function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.twilio.com:3478' },
  ];

  const turnUrl = (import.meta.env.VITE_TURN_URL || '').trim();
  const turnUser = (import.meta.env.VITE_TURN_USERNAME || '').trim();
  const turnCred = (import.meta.env.VITE_TURN_CREDENTIAL || '').trim();
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      ...(turnUser ? { username: turnUser } : {}),
      ...(turnCred ? { credential: turnCred } : {}),
    });
  }

  return servers;
}

export function createResilientPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: buildIceServers(),
    iceCandidatePoolSize: 6,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  });
}

/**
 * Buffers remote ICE candidates that arrive before setRemoteDescription completes,
 * preventing dropped handshakes on mobile/4G networks.
 */
export class IceCandidateQueue {
  private queue = new Map<string, RTCIceCandidateInit[]>();

  async addOrQueue(peerId: string, pc: RTCPeerConnection | undefined, candidate: RTCIceCandidateInit): Promise<void> {
    if (!candidate) return;
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      return;
    }
    const list = this.queue.get(peerId) || [];
    list.push(candidate);
    this.queue.set(peerId, list.slice(-40));
  }

  async flush(peerId: string, pc: RTCPeerConnection): Promise<void> {
    const list = this.queue.get(peerId);
    if (!list || list.length === 0) return;
    this.queue.delete(peerId);
    for (const c of list) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }
  }

  clear(peerId?: string): void {
    if (peerId) this.queue.delete(peerId);
    else this.queue.clear();
  }
}

/**
 * Monitors ICE & connection state on a peer and automatically triggers ICE restart
 * with renegotiation if the network briefly drops (e.g. Wi-Fi -> 4G switch).
 */
export function attachPeerAutoRecovery(opts: {
  pc: RTCPeerConnection;
  onRestartOffer: (offer: RTCSessionDescriptionInit) => void;
  onStatusChange?: (status: RtcLinkStatus) => void;
}): () => void {
  const { pc, onRestartOffer, onStatusChange } = opts;
  let retries = 0;
  let timer: number | null = null;
  let disposed = false;

  const scheduleRestart = () => {
    if (disposed || retries >= 3 || pc.signalingState === 'closed') return;
    if (timer !== null) window.clearTimeout(timer);
    retries += 1;
    const delayMs = retries * 1500;
    onStatusChange?.('reconnecting');
    timer = window.setTimeout(async () => {
      if (disposed || pc.signalingState === 'closed') return;
      try {
        if (typeof pc.restartIce === 'function') pc.restartIce();
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        onRestartOffer(offer);
      } catch {
        // ignore if peer closed during restart
      }
    }, delayMs);
  };

  const handleState = () => {
    const ice = pc.iceConnectionState;
    const conn = pc.connectionState;
    if (ice === 'connected' || ice === 'completed' || conn === 'connected') {
      retries = 0;
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      onStatusChange?.('connected');
    } else if (ice === 'checking' || conn === 'connecting') {
      onStatusChange?.('connecting');
    } else if (ice === 'disconnected' || ice === 'failed' || conn === 'disconnected' || conn === 'failed') {
      scheduleRestart();
    }
  };

  pc.addEventListener('iceconnectionstatechange', handleState);
  pc.addEventListener('connectionstatechange', handleState);

  return () => {
    disposed = true;
    if (timer !== null) window.clearTimeout(timer);
    pc.removeEventListener('iceconnectionstatechange', handleState);
    pc.removeEventListener('connectionstatechange', handleState);
  };
}
