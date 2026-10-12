// utils/partySync.ts
/**
 * Serverless Real-Time Party Sync for Tambola Number Caller
 * Uses public encrypted WebSocket transport with zero backend requirements.
 */

export type WinClaimType =
  | 'Early 5'
  | 'Top Line'
  | 'Middle Line'
  | 'Bottom Line'
  | 'Four Corners'
  | 'Full House';

export type PartyMessage =
  | {
      type: 'NUMBER_CALLED';
      currentNumber: number;
      calledList: number[];
      totalCalled: number;
      hostName: string;
      timestamp: number;
    }
  | {
      type: 'GAME_RESET';
      hostName: string;
      timestamp: number;
    }
  | {
      type: 'CLAIM_WIN';
      playerName: string;
      claimType: WinClaimType;
      timestamp: number;
    }
  | {
      type: 'HOST_PING';
      hostName: string;
      currentNumber: number;
      calledList: number[];
      timestamp: number;
    };

function getTopic(roomCode: string): string {
  const clean = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `tambola_party_${clean}`;
}

/**
 * Broadcast a message to the party room
 */
export async function broadcastPartyMessage(roomCode: string, payload: PartyMessage): Promise<boolean> {
  const topic = getTopic(roomCode);
  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.warn('[PartySync] Broadcast error:', e);
    return false;
  }
}

export interface PartyConnection {
  disconnect: () => void;
  sendClaim: (claimType: WinClaimType, playerName: string) => Promise<boolean>;
}

/**
 * Connect to a party room as a player or host
 */
export function connectToPartyRoom(
  roomCode: string,
  onMessage: (message: PartyMessage) => void,
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void
): PartyConnection {
  const topic = getTopic(roomCode);
  const wsUrl = `wss://ntfy.sh/${topic}/ws`;
  let isClosedManually = false;
  let socket: WebSocket | null = null;
  let reconnectTimeout: any = null;

  function connect() {
    if (isClosedManually) return;
    onStatusChange?.('connecting');

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        onStatusChange?.('connected');
        console.log(`[PartySync] Connected to room: ${roomCode}`);
      };

      socket.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.event === 'message' && raw.message) {
            const parsed: PartyMessage = JSON.parse(raw.message);
            onMessage(parsed);
          }
        } catch (err) {
          // Ignore non-json or ping messages
        }
      };

      socket.onerror = (err) => {
        console.warn('[PartySync] Socket error', err);
      };

      socket.onclose = () => {
        if (!isClosedManually) {
          onStatusChange?.('disconnected');
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    } catch (e) {
      console.warn('[PartySync] Connection failed', e);
      if (!isClosedManually) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }
  }

  connect();

  return {
    disconnect: () => {
      isClosedManually = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        try {
          socket.close();
        } catch (e) {}
      }
      onStatusChange?.('disconnected');
    },
    sendClaim: async (claimType: WinClaimType, playerName: string) => {
      return broadcastPartyMessage(roomCode, {
        type: 'CLAIM_WIN',
        playerName: playerName || 'Player',
        claimType,
        timestamp: Date.now(),
      });
    },
  };
}

/**
 * Generate a clean, pronounceable 4-digit alphanumeric room code (e.g. 7492 or A824)
 */
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
