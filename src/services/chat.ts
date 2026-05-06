import type { ChatMessage } from '@/types/firestore';
import { now } from '@/types/firestore';
import { createEmitter, type Unsubscribe } from '@/lib/emitter';
import { mockChat } from '@/data/mockChat';

const RATE_LIMIT_MS = 3000;
const MAX_LEN = 240;
const MAX_MESSAGES = 100;

const emitter = createEmitter<ChatMessage[]>(mockChat);
const lastSentByUid = new Map<string, number>();

let nextLocalId = 1;
const localId = () => `local-${Date.now()}-${nextLocalId++}`;

export const subscribeToChat = (listener: (messages: ChatMessage[]) => void): Unsubscribe =>
  emitter.subscribe((list) =>
    listener(
      [...list]
        .filter((m) => m.deletedAt === null)
        .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()),
    ),
  );

export interface SendChatInput {
  uid: string;
  displayName: string;
  text: string;
}

export class ChatError extends Error {
  constructor(
    public code: 'rate_limit' | 'too_long' | 'empty',
    message: string,
  ) {
    super(message);
  }
}

export const sendChatMessage = async (input: SendChatInput): Promise<ChatMessage> => {
  const text = input.text.trim();
  if (text.length === 0) throw new ChatError('empty', 'text required');
  if (text.length > MAX_LEN) throw new ChatError('too_long', 'text too long (max 240 chars)');

  const last = lastSentByUid.get(input.uid) ?? 0;
  if (Date.now() - last < RATE_LIMIT_MS) {
    throw new ChatError('rate_limit', 'You can send one message every 3 seconds.');
  }
  lastSentByUid.set(input.uid, Date.now());

  const msg: ChatMessage = {
    id: localId(),
    uid: input.uid,
    displayName: input.displayName,
    text,
    createdAt: now(),
    deletedAt: null,
  };

  emitter.set((prev) => [...prev, msg].slice(-MAX_MESSAGES));
  return msg;
};
