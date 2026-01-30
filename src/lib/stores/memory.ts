// Persistent user memory - compressed session history + variable store
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface UserMemory {
	// Compressed summary of previous sessions
	summary: string;
	// Key variables that can't compress (name, project, preferences)
	variables: Record<string, string>;
	// Last updated timestamp
	lastUpdated: number;
}

const STORAGE_KEY = 'saga-logo-memory';

const defaultMemory: UserMemory = {
	summary: '',
	variables: {},
	lastUpdated: 0
};

function loadFromStorage(): UserMemory {
	if (!browser) return defaultMemory;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.error('Failed to load memory:', e);
	}
	return defaultMemory;
}

function createMemoryStore() {
	const initial = loadFromStorage();
	const { subscribe, set, update } = writable<UserMemory>(initial);

	if (browser) {
		subscribe((mem) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
		});
	}

	return {
		subscribe,

		// Update the compressed summary
		setSummary: (summary: string) => {
			update((m) => ({
				...m,
				summary,
				lastUpdated: Date.now()
			}));
		},

		// Set a variable
		setVariable: (key: string, value: string) => {
			update((m) => ({
				...m,
				variables: { ...m.variables, [key]: value },
				lastUpdated: Date.now()
			}));
		},

		// Remove a variable
		removeVariable: (key: string) => {
			update((m) => {
				const { [key]: _, ...rest } = m.variables;
				return { ...m, variables: rest, lastUpdated: Date.now() };
			});
		},

		// Clear all memory
		clear: () => {
			set(defaultMemory);
		},

		// Get context string for injection into prompts
		getContextString: (mem: UserMemory): string => {
			const parts: string[] = [];

			if (Object.keys(mem.variables).length > 0) {
				parts.push('USER CONTEXT:');
				for (const [key, value] of Object.entries(mem.variables)) {
					parts.push(`- ${key}: ${value}`);
				}
			}

			if (mem.summary) {
				parts.push('');
				parts.push('PREVIOUS SESSION SUMMARY:');
				parts.push(mem.summary);
			}

			return parts.join('\n');
		}
	};
}

export const memory = createMemoryStore();
