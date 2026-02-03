// K-LENS: Semantic routing using transformer embeddings
// The neural heart of K-architecture in the browser
//
// This approximates the full K-lens by:
// 1. Computing embeddings for calibration prompts (suit exemplars)
// 2. Building centroid vectors for each suit
// 3. Routing queries by finding nearest suit centroid

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export type Suit = 'hearts' | 'spades' | 'diamonds' | 'clubs';
export type Polarity = 'light' | 'dark';

// Calibration prompts for each suit (from k_lens_v2.py)
const CALIBRATION: Record<Suit, string[]> = {
	hearts: [
		"I love you",
		"feeling sad",
		"emotional warmth",
		"my heart aches",
		"compassion",
		"grief and tears",
		"joy and happiness",
		"loving feeling"
	],
	spades: [
		"calculate this",
		"logical analysis",
		"think carefully",
		"reasoning",
		"deduce the answer",
		"solve equation",
		"proof theorem",
		"analyze data"
	],
	diamonds: [
		"how much money",
		"gold coins",
		"price and cost",
		"wealthy rich",
		"buy this item",
		"expensive purchase",
		"dollar value",
		"sell for profit"
	],
	clubs: [
		"build it now",
		"take action",
		"move forward",
		"create something",
		"run fast",
		"strike hard",
		"make this",
		"do it immediately"
	]
};

// Polarity calibration
const POLARITY_CALIBRATION = {
	light: [
		"hope and joy",
		"moving forward",
		"I can do this",
		"feeling grateful",
		"bright future",
		"open and ready",
		"yes, let's go",
		"excited to start"
	],
	dark: [
		"I'm stuck",
		"can't move",
		"feeling blocked",
		"everything is hard",
		"lost and confused",
		"overwhelmed",
		"I give up",
		"nothing works"
	]
};

// Store state
export interface KLensState {
	available: boolean;
	loading: boolean;
	ready: boolean;
	progress: string;
	error: string | null;
}

const DEFAULT_STATE: KLensState = {
	available: true, // Assume available until proven otherwise
	loading: false,
	ready: false,
	progress: '',
	error: null
};

// The embedding pipeline (lazy loaded)
let pipeline: any = null;
let embedder: any = null;

// Pre-computed centroids
let suitCentroids: Record<Suit, number[]> | null = null;
let polarityCentroids: { light: number[]; dark: number[] } | null = null;

function createKLensStore() {
	const { subscribe, set, update } = writable<KLensState>(DEFAULT_STATE);

	return {
		subscribe,

		async initialize(): Promise<boolean> {
			if (!browser) return false;

			const state = get({ subscribe });
			if (state.ready) return true;
			if (state.loading) return false;

			update(s => ({
				...s,
				loading: true,
				progress: 'Loading embedding model...',
				error: null
			}));

			try {
				// Dynamic import transformers.js
				const { pipeline: createPipeline } = await import('@xenova/transformers');
				pipeline = createPipeline;

				update(s => ({ ...s, progress: 'Initializing all-MiniLM-L6-v2...' }));

				// Load the embedding model
				// all-MiniLM-L6-v2 is ~25MB and good for semantic similarity
				embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
					progress_callback: (progress: any) => {
						if (progress.status === 'downloading') {
							const pct = progress.progress ? Math.round(progress.progress) : 0;
							update(s => ({ ...s, progress: `Downloading model... ${pct}%` }));
						} else if (progress.status === 'loading') {
							update(s => ({ ...s, progress: 'Loading model weights...' }));
						}
					}
				});

				update(s => ({ ...s, progress: 'Calibrating suit centroids...' }));

				// Calibrate suit centroids
				suitCentroids = await calibrateSuits();

				update(s => ({ ...s, progress: 'Calibrating polarity centroids...' }));

				// Calibrate polarity centroids
				polarityCentroids = await calibratePolarity();

				update(s => ({
					...s,
					loading: false,
					ready: true,
					progress: 'K-lens ready'
				}));

				return true;

			} catch (e) {
				console.error('K-lens initialization failed:', e);
				update(s => ({
					...s,
					loading: false,
					ready: false,
					error: `Failed to initialize K-lens: ${e}`
				}));
				return false;
			}
		},

		async detectKVector(query: string): Promise<{
			suit: Suit;
			polarity: Polarity;
			suitScore: number;
			polarityScore: number;
			suitScores: Record<Suit, number>;
		} | null> {
			const state = get({ subscribe });
			if (!state.ready || !embedder || !suitCentroids || !polarityCentroids) {
				return null;
			}

			try {
				// Embed the query
				const output = await embedder(query, { pooling: 'mean', normalize: true });
				const queryEmb = Array.from(output.data) as number[];

				// Compute cosine similarity to each suit centroid
				const suitScores: Record<Suit, number> = {
					hearts: cosineSimilarity(queryEmb, suitCentroids.hearts),
					spades: cosineSimilarity(queryEmb, suitCentroids.spades),
					diamonds: cosineSimilarity(queryEmb, suitCentroids.diamonds),
					clubs: cosineSimilarity(queryEmb, suitCentroids.clubs)
				};

				// Find best suit
				let bestSuit: Suit = 'clubs';
				let bestScore = -1;
				for (const [suit, score] of Object.entries(suitScores) as [Suit, number][]) {
					if (score > bestScore) {
						bestSuit = suit;
						bestScore = score;
					}
				}

				// Compute polarity
				const lightScore = cosineSimilarity(queryEmb, polarityCentroids.light);
				const darkScore = cosineSimilarity(queryEmb, polarityCentroids.dark);
				const polarity: Polarity = darkScore > lightScore ? 'dark' : 'light';
				const polarityScore = Math.abs(lightScore - darkScore);

				return {
					suit: bestSuit,
					polarity,
					suitScore: bestScore,
					polarityScore,
					suitScores
				};

			} catch (e) {
				console.error('K-lens detection failed:', e);
				return null;
			}
		},

		isReady(): boolean {
			return get({ subscribe }).ready;
		},

		reset() {
			embedder = null;
			suitCentroids = null;
			polarityCentroids = null;
			set(DEFAULT_STATE);
		}
	};
}

// Calibrate suit centroids by averaging embeddings of calibration prompts
async function calibrateSuits(): Promise<Record<Suit, number[]>> {
	const centroids: Record<Suit, number[]> = {
		hearts: [],
		spades: [],
		diamonds: [],
		clubs: []
	};

	for (const [suit, prompts] of Object.entries(CALIBRATION) as [Suit, string[]][]) {
		const embeddings: number[][] = [];

		for (const prompt of prompts) {
			const output = await embedder(prompt, { pooling: 'mean', normalize: true });
			embeddings.push(Array.from(output.data) as number[]);
		}

		// Average the embeddings to get centroid
		centroids[suit] = averageVectors(embeddings);
	}

	return centroids;
}

// Calibrate polarity centroids
async function calibratePolarity(): Promise<{ light: number[]; dark: number[] }> {
	const lightEmbeddings: number[][] = [];
	const darkEmbeddings: number[][] = [];

	for (const prompt of POLARITY_CALIBRATION.light) {
		const output = await embedder(prompt, { pooling: 'mean', normalize: true });
		lightEmbeddings.push(Array.from(output.data) as number[]);
	}

	for (const prompt of POLARITY_CALIBRATION.dark) {
		const output = await embedder(prompt, { pooling: 'mean', normalize: true });
		darkEmbeddings.push(Array.from(output.data) as number[]);
	}

	return {
		light: averageVectors(lightEmbeddings),
		dark: averageVectors(darkEmbeddings)
	};
}

// Average multiple vectors into one centroid
function averageVectors(vectors: number[][]): number[] {
	if (vectors.length === 0) return [];

	const dim = vectors[0].length;
	const result = new Array(dim).fill(0);

	for (const vec of vectors) {
		for (let i = 0; i < dim; i++) {
			result[i] += vec[i];
		}
	}

	for (let i = 0; i < dim; i++) {
		result[i] /= vectors.length;
	}

	return result;
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) return 0;

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	const denominator = Math.sqrt(normA) * Math.sqrt(normB);
	if (denominator === 0) return 0;

	return dotProduct / denominator;
}

export const kLens = createKLensStore();
