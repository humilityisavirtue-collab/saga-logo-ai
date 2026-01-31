import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'saga-logo-settings';

export interface Settings {
	apiKey: string; // Legacy - still used for active key
	apiProvider: 'anthropic' | 'openai' | 'google' | 'openrouter';
	model: string;
	// Per-provider keys
	anthropicKey: string;
	openaiKey: string;
	googleKey: string;
	openrouterKey: string;
}

const defaultSettings: Settings = {
	apiKey: '',
	apiProvider: 'anthropic',
	model: 'claude-sonnet-4-20250514',
	anthropicKey: '',
	openaiKey: '',
	googleKey: '',
	openrouterKey: ''
};

function loadSettings(): Settings {
	if (!browser) return defaultSettings;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return defaultSettings;
	try {
		return { ...defaultSettings, ...JSON.parse(stored) };
	} catch {
		return defaultSettings;
	}
}

function createSettingsStore() {
	const { subscribe, set, update } = writable<Settings>(defaultSettings);

	let initialized = false;

	// Initialize from localStorage on client
	if (browser) {
		const stored = loadSettings();
		set(stored);
		initialized = true;

		// Save to localStorage on changes
		subscribe((value) => {
			if (initialized) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			}
		});
	}

	return {
		subscribe,
		set,
		update,
		setApiKey: (key: string) => update((s) => ({ ...s, apiKey: key })),
		setProvider: (provider: 'anthropic' | 'openai' | 'google' | 'openrouter') => update((s) => ({ ...s, apiProvider: provider })),
		setModel: (model: string) => update((s) => ({ ...s, model })),
		hasApiKey: () => {
			let hasKey = false;
			subscribe((s) => (hasKey = !!s.apiKey))();
			return hasKey;
		},
		// Force reload from localStorage
		reload: () => {
			if (browser) {
				set(loadSettings());
			}
		}
	};
}

export const settings = createSettingsStore();
