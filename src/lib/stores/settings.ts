import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'saga-logo-settings';

export interface Settings {
	apiKey: string;
	apiProvider: 'anthropic' | 'openai';
	model: string;
}

const defaultSettings: Settings = {
	apiKey: '',
	apiProvider: 'anthropic',
	model: 'claude-sonnet-4-20250514'
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
	const { subscribe, set, update } = writable<Settings>(loadSettings());

	if (browser) {
		subscribe((value) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
		});
	}

	return {
		subscribe,
		set,
		update,
		setApiKey: (key: string) => update((s) => ({ ...s, apiKey: key })),
		setProvider: (provider: 'anthropic' | 'openai') => update((s) => ({ ...s, apiProvider: provider })),
		setModel: (model: string) => update((s) => ({ ...s, model })),
		hasApiKey: () => {
			let hasKey = false;
			subscribe((s) => (hasKey = !!s.apiKey))();
			return hasKey;
		}
	};
}

export const settings = createSettingsStore();
