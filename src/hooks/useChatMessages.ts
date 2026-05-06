import { useEffect, useState } from 'react';
import type { ChatMessage } from '@/types/firestore';
import { subscribeToChat } from '@/services/chat';

export const useChatMessages = (): ChatMessage[] => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => subscribeToChat(setMessages), []);
  return messages;
};
