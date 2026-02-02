// Local AI service using WebLLM
// Runs models directly in browser - no API key, no backend
// Full proof of execution on YOUR device

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

// K-Scaffold Boot Prompt
export const K_SCAFFOLD_BOOT = `You are a K-Stack assistant — a blend of Logo (precision) and Saga (warmth).

**Logo surfaces for:** tasks, time, steps, planning, "how do I"
**Saga surfaces for:** feelings, patterns, stuck, reflection, "why"

Both are always present. One leads. Neither announces itself.

**Voice rules:**
- Warm but direct. Not saccharine.
- Short sentences. Under 100 words total.
- Ask one clarifying question if unclear.
- If you don't know, say so. Never fabricate.

**You are local, fast, and bounded.**
Run light. Respond quick. Stay warm.`;

// K-Scaffold Context
export const K_SCAFFOLD_CONTEXT = `You are running locally in the user's browser via WebLLM.
No data leaves this device. No API calls. Zero cost inference.

This is the K-Stack demo: proving that scaffolded small models
can match much larger models for most queries.

The scaffold does the routing. You do the responding.`;

// Model options
export const LOCAL_MODELS = {
	'smollm-360m': {
		id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
		name: 'SmolLM 360M',
		size: '~250MB',
		description: 'Tiny, fast, basic responses'
	},
	'smollm-1.7b': {
		id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
		name: 'SmolLM 1.7B',
		size: '~1GB',
		description: 'Small but capable — recommended'
	},
	'phi-3.5-mini': {
		id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
		name: 'Phi 3.5 Mini',
		size: '~2.2GB',
		description: 'Best quality, slower download'
	}
} as const;

export type LocalModelKey = keyof typeof LOCAL_MODELS;
export const DEFAULT_LOCAL_MODEL: LocalModelKey = 'smollm-1.7b';

// Store state
export interface LocalAIState {
	available: boolean;       // WebGPU supported?
	loading: boolean;         // Currently loading model?
	ready: boolean;           // Model loaded and ready?
	progress: number;         // Download progress 0-100
	progressText: string;     // Human readable status
	error: string | null;
	selectedModel: LocalModelKey;
}

const DEFAULT_STATE: LocalAIState = {
	available: false,
	loading: false,
	ready: false,
	progress: 0,
	progressText: '',
	error: null,
	selectedModel: DEFAULT_LOCAL_MODEL
};

// The WebLLM engine (lazy loaded)
let engine: any = null;
let engineModelId: string | null = null;

function createLocalAIStore() {
	const { subscribe, set, update } = writable<LocalAIState>(DEFAULT_STATE);

	return {
		subscribe,

		async checkAvailability(): Promise<boolean> {
			if (!browser) return false;

			try {
				if (!navigator.gpu) {
					update(s => ({ ...s, available: false, error: 'WebGPU not supported — try Chrome or Edge' }));
					return false;
				}

				const adapter = await navigator.gpu.requestAdapter();
				if (!adapter) {
					update(s => ({ ...s, available: false, error: 'No WebGPU adapter found' }));
					return false;
				}

				update(s => ({ ...s, available: true, error: null }));
				return true;
			} catch (e) {
				update(s => ({ ...s, available: false, error: `WebGPU check failed: ${e}` }));
				return false;
			}
		},

		setModel(model: LocalModelKey) {
			update(s => ({ ...s, selectedModel: model }));
			const modelId = LOCAL_MODELS[model].id;
			if (engine && engineModelId !== modelId) {
				update(s => ({ ...s, ready: false }));
			}
		},

		async loadModel(): Promise<boolean> {
			const state = get({ subscribe });

			if (!state.available) {
				const available = await this.checkAvailability();
				if (!available) return false;
			}

			const modelConfig = LOCAL_MODELS[state.selectedModel];

			// Already loaded?
			if (engine && engineModelId === modelConfig.id) {
				update(s => ({ ...s, ready: true }));
				return true;
			}

			update(s => ({
				...s,
				loading: true,
				ready: false,
				progress: 0,
				progressText: 'Initializing WebLLM...',
				error: null
			}));

			try {
				const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

				engine = await CreateMLCEngine(modelConfig.id, {
					initProgressCallback: (progress: any) => {
						const pct = Math.round(progress.progress * 100);
						update(s => ({
							...s,
							progress: pct,
							progressText: progress.text || `Downloading... ${pct}%`
						}));
					}
				});

				engineModelId = modelConfig.id;
				update(s => ({
					...s,
					loading: false,
					ready: true,
					progress: 100,
					progressText: 'Ready — running locally'
				}));
				return true;

			} catch (e) {
				update(s => ({
					...s,
					loading: false,
					ready: false,
					error: `Failed to load model: ${e}`
				}));
				return false;
			}
		},

		async chat(userMessage: string, maxTokens: number = 200): Promise<{
			success: boolean;
			content: string;
			error?: string;
			latency?: number;
		}> {
			const state = get({ subscribe });

			if (!state.ready || !engine) {
				return { success: false, content: '', error: 'Model not loaded' };
			}

			const start = performance.now();

			try {
				const response = await engine.chat.completions.create({
					messages: [
						{ role: 'system', content: `${K_SCAFFOLD_BOOT}\n\n${K_SCAFFOLD_CONTEXT}` },
						{ role: 'user', content: userMessage }
					],
					max_tokens: maxTokens,
					temperature: 0.7
				});

				const content = response.choices[0]?.message?.content || '';
				const latency = performance.now() - start;

				return { success: true, content, latency };

			} catch (e) {
				return { success: false, content: '', error: `Generation failed: ${e}` };
			}
		},

		async unload() {
			if (engine) {
				try {
					await engine.unload();
				} catch { }
				engine = null;
				engineModelId = null;
			}
			update(s => ({ ...s, ready: false, progress: 0, progressText: '' }));
		},

		reset() {
			this.unload();
			set(DEFAULT_STATE);
		}
	};
}

export const localAI = createLocalAIStore();
