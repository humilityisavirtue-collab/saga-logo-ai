import { writable } from 'svelte/store';
import type { PersonaMode } from '$lib/personas';

export interface Message {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	persona?: PersonaMode;
	timestamp: Date;
}

function createChatStore() {
	const { subscribe, set, update } = writable<Message[]>([]);

	return {
		subscribe,
		addMessage: (role: 'user' | 'assistant', content: string, persona?: PersonaMode) => {
			update((messages) => [
				...messages,
				{
					id: crypto.randomUUID(),
					role,
					content,
					persona,
					timestamp: new Date()
				}
			]);
		},
		clear: () => set([]),
		updateLastMessage: (content: string) => {
			update((messages) => {
				if (messages.length === 0) return messages;
				const updated = [...messages];
				updated[updated.length - 1] = {
					...updated[updated.length - 1],
					content
				};
				return updated;
			});
		}
	};
}

export const chat = createChatStore();
