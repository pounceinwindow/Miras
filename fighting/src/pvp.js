import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isPvpConfigured = Boolean(supabaseUrl && supabaseKey);

const client = isPvpConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createPeerId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export function createRoomCode() {
  const values = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(values, value => alphabet[value % alphabet.length]).join('');
}

export class PvpConnection {
  constructor({ role, room, hero, onMatched, onState, onInput, onLeave, onError }) {
    this.role = role;
    this.room = room.toUpperCase();
    this.hero = hero;
    this.onMatched = onMatched;
    this.onState = onState;
    this.onInput = onInput;
    this.onLeave = onLeave;
    this.onError = onError;
    this.id = createPeerId();
    this.peerId = null;
    this.channel = null;
    this.heartbeat = null;
    this.closed = false;
  }

  async connect() {
    if (!client) throw new Error('Supabase не настроен для сетевой игры.');
    this.channel = client.channel(`miras-pvp-${this.room}`, {
      config: { broadcast: { self: false, ack: false } },
    });
    this.channel.on('broadcast', { event: 'message' }, ({ payload }) => {
      this.receive(payload);
    });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Не удалось подключиться к комнате.')), 8000);
      this.channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          reject(new Error('Сетевой канал недоступен. Попробуйте ещё раз.'));
        }
      });
    });
    this.announce();
    this.heartbeat = setInterval(() => this.announce(), 900);
  }

  announce() {
    if (this.role === 'host') this.send('offer', { hero: this.hero });
    else if (!this.peerId) this.send('join', { hero: this.hero });
  }

  receive(message) {
    if (!message || message.sender === this.id || this.closed) return;
    const { kind, sender, payload = {} } = message;
    if (this.role === 'host' && kind === 'join') {
      if (this.peerId && this.peerId !== sender) return;
      this.peerId = sender;
      clearInterval(this.heartbeat);
      this.heartbeat = null;
      this.send('accepted', { guestId: sender, hostHero: this.hero, guestHero: payload.hero });
      this.onMatched?.({ ownHero: this.hero, opponentHero: payload.hero });
      return;
    }
    if (this.role === 'guest' && kind === 'offer' && !this.peerId) {
      this.send('join', { hero: this.hero });
      return;
    }
    if (this.role === 'guest' && kind === 'accepted' && payload.guestId === this.id) {
      this.peerId = sender;
      clearInterval(this.heartbeat);
      this.heartbeat = null;
      this.onMatched?.({ ownHero: payload.guestHero, opponentHero: payload.hostHero });
      return;
    }
    if (!this.peerId || sender !== this.peerId) return;
    if (this.role === 'host' && kind === 'input') this.onInput?.(payload);
    if (this.role === 'guest' && kind === 'state') this.onState?.(payload);
    if (kind === 'leave') this.onLeave?.();
  }

  send(kind, payload = {}) {
    if (!this.channel || this.closed) return Promise.resolve();
    return this.channel.send({
      type: 'broadcast',
      event: 'message',
      payload: { kind, payload, sender: this.id },
    }).catch(error => this.onError?.(error));
  }

  sendInput(action, value) {
    return this.send('input', { action, value });
  }

  sendState(state, events) {
    return this.send('state', { state, events });
  }

  async close(notify = true) {
    if (this.closed) return;
    if (notify) await this.send('leave');
    this.closed = true;
    clearInterval(this.heartbeat);
    this.heartbeat = null;
    if (this.channel && client) await client.removeChannel(this.channel);
    this.channel = null;
  }
}
