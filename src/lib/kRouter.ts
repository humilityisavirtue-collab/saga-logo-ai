// K-Router — Template-first routing for the K-Stack
// Route queries through templates BEFORE generation
// The scaffold does the knowing, the model does the speaking

import { TEMPLATES, type Template } from './templates';
import { kLens } from './kLens';

// Flag to track if we're using semantic K-lens or keyword fallback
let useSemanticLens = false;
let semanticLensChecked = false;

// ============================================================
// K-LENS LITE: Browser-based suit/polarity detection
// ============================================================

export type Suit = 'hearts' | 'spades' | 'diamonds' | 'clubs';
export type Polarity = 'light' | 'dark';

// Calibration keywords for each suit (from k_lens_v2.py)
const SUIT_SIGNALS: Record<Suit, string[]> = {
	hearts: [
		'love', 'feel', 'feeling', 'emotion', 'heart', 'sad', 'happy', 'joy',
		'grief', 'compassion', 'warm', 'care', 'miss', 'lonely', 'connection',
		'relationship', 'friend', 'family', 'hurt', 'healing', 'grateful'
	],
	spades: [
		'think', 'analyze', 'calculate', 'logic', 'reason', 'understand',
		'explain', 'why', 'how', 'what', 'define', 'prove', 'deduce',
		'solve', 'figure', 'consider', 'evaluate', 'compare', 'contrast'
	],
	diamonds: [
		'money', 'cost', 'price', 'buy', 'sell', 'gold', 'rich', 'wealth',
		'dollar', 'budget', 'invest', 'save', 'spend', 'value', 'worth',
		'body', 'health', 'food', 'sleep', 'physical', 'material', 'ground'
	],
	clubs: [
		'do', 'make', 'build', 'create', 'action', 'move', 'start', 'begin',
		'run', 'go', 'try', 'execute', 'implement', 'launch', 'strike',
		'energy', 'will', 'power', 'force', 'push', 'drive'
	]
};

// Polarity signals
const POLARITY_SIGNALS = {
	light: [
		'good', 'great', 'love', 'happy', 'joy', 'hope', 'yes', 'can',
		'will', 'ready', 'excited', 'grateful', 'thanks', 'thank', 'help',
		'open', 'clear', 'bright', 'forward', 'growth', 'better'
	],
	dark: [
		'stuck', 'can\'t', 'won\'t', 'no', 'never', 'hate', 'angry', 'sad',
		'fear', 'scared', 'anxious', 'overwhelm', 'blocked', 'lost', 'fail',
		'broken', 'hurt', 'pain', 'struggle', 'hard', 'difficult', 'wrong'
	]
};

// Escalation signals — queries that need real knowledge
const ESCALATION_SIGNALS = [
	'how does', 'what is', 'explain', 'why is', 'tell me about', 'define',
	'who is', 'when did', 'where is', 'history of', 'meaning of'
];

// ============================================================
// FULLY LOCAL MODE
// ============================================================

let fullyLocalMode = false;

/**
 * Enable or disable fully local mode.
 * When enabled, never escalates to API — all generation stays local.
 */
export function setFullyLocalMode(enabled: boolean) {
	fullyLocalMode = enabled;
}

/**
 * Check if fully local mode is enabled.
 */
export function isFullyLocalMode(): boolean {
	return fullyLocalMode;
}

// ============================================================
// K-VECTOR DETECTION
// ============================================================

export interface KVector {
	suit: Suit;
	polarity: Polarity;
	suitScore: number;
	polarityScore: number;
	suitScores: Record<Suit, number>;
}

/**
 * Detect K-vector using semantic K-lens (async version).
 * Falls back to keyword detection if K-lens not ready.
 */
export async function detectKVectorSemantic(query: string): Promise<KVector> {
	// Try semantic K-lens first
	if (kLens.isReady()) {
		const result = await kLens.detectKVector(query);
		if (result) {
			useSemanticLens = true;
			return result;
		}
	}

	// Fall back to keyword detection
	useSemanticLens = false;
	return detectKVectorKeywords(query);
}

/**
 * Check if last detection used semantic K-lens or keyword fallback.
 */
export function usedSemanticLens(): boolean {
	return useSemanticLens;
}

/**
 * Detect K-vector from query text using keywords (sync fallback).
 * Returns suit (H/S/D/C) and polarity (+/-) with confidence scores.
 */
export function detectKVectorKeywords(query: string): KVector {
	const words = query.toLowerCase().split(/\s+/);
	const wordSet = new Set(words);

	// Score each suit
	const suitScores: Record<Suit, number> = {
		hearts: 0,
		spades: 0,
		diamonds: 0,
		clubs: 0
	};

	for (const [suit, signals] of Object.entries(SUIT_SIGNALS) as [Suit, string[]][]) {
		for (const signal of signals) {
			if (wordSet.has(signal)) {
				suitScores[suit] += 2; // exact match
			} else if (query.toLowerCase().includes(signal)) {
				suitScores[suit] += 1; // substring
			}
		}
	}

	// Find best suit
	let bestSuit: Suit = 'clubs'; // default to action
	let bestSuitScore = 0;
	for (const [suit, score] of Object.entries(suitScores) as [Suit, number][]) {
		if (score > bestSuitScore) {
			bestSuit = suit;
			bestSuitScore = score;
		}
	}

	// Score polarity
	let lightScore = 0;
	let darkScore = 0;

	for (const signal of POLARITY_SIGNALS.light) {
		if (wordSet.has(signal)) lightScore += 2;
		else if (query.toLowerCase().includes(signal)) lightScore += 1;
	}

	for (const signal of POLARITY_SIGNALS.dark) {
		if (wordSet.has(signal)) darkScore += 2;
		else if (query.toLowerCase().includes(signal)) darkScore += 1;
	}

	const polarity: Polarity = darkScore > lightScore ? 'dark' : 'light';
	const polarityScore = Math.abs(lightScore - darkScore);

	return {
		suit: bestSuit,
		polarity,
		suitScore: bestSuitScore,
		polarityScore,
		suitScores
	};
}

/**
 * Format K-vector as shorthand: +3H, -7S, etc.
 */
export function formatKVector(kv: KVector, rank: number = 5): string {
	const p = kv.polarity === 'light' ? '+' : '-';
	const s = kv.suit[0].toUpperCase();
	return `${p}${rank}${s}`;
}

// ============================================================
// ROUTING RESULT
// ============================================================

export interface RouteResult {
	matched: boolean;
	template?: Template;
	surface?: string;
	score: number;
	action: 'template' | 'generate' | 'escalate';
	reason: string;
	kVector?: KVector;
}

// ============================================================
// CONVERSATION CONTEXT
// ============================================================

interface ConversationTurn {
	role: 'user' | 'assistant';
	content: string;
	kVector?: KVector;
	source?: 'template' | 'generation' | 'escalation';
	timestamp: number;
}

let conversationHistory: ConversationTurn[] = [];

export function addToHistory(turn: ConversationTurn) {
	conversationHistory.push(turn);
	// Keep last 10 turns
	if (conversationHistory.length > 10) {
		conversationHistory = conversationHistory.slice(-10);
	}
}

export function getHistory(): ConversationTurn[] {
	return [...conversationHistory];
}

export function clearHistory() {
	conversationHistory = [];
}

export function getRecentContext(): string {
	if (conversationHistory.length === 0) return '';

	const recent = conversationHistory.slice(-4);
	return recent.map(t => `${t.role}: ${t.content}`).join('\n');
}

// ============================================================
// MAIN ROUTING FUNCTION
// ============================================================

// Sync alias for keyword-based detection (backwards compatibility)
export function detectKVector(query: string): KVector {
	return detectKVectorKeywords(query);
}

/**
 * Route a query through the K-Stack (async version with semantic K-lens).
 * 1. Detect K-vector (suit/polarity) using semantic embeddings
 * 2. Match against templates with K-vector boosting
 * 3. Return template, generate signal, or escalate signal
 */
export async function routeAsync(query: string): Promise<RouteResult> {
	const kVector = await detectKVectorSemantic(query);
	return routeWithKVector(query, kVector);
}

/**
 * Route a query through the K-Stack (sync version with keyword fallback).
 */
export function route(query: string): RouteResult {
	const kVector = detectKVectorKeywords(query);
	return routeWithKVector(query, kVector);
}

/**
 * Internal routing logic with a pre-computed K-vector.
 */
function routeWithKVector(query: string, kVector: KVector): RouteResult {
	const queryLower = query.toLowerCase();
	const queryWords = new Set(queryLower.split(/\s+/));

	// Check for escalation signals first
	const needsEscalation = ESCALATION_SIGNALS.some(sig => queryLower.includes(sig));

	// Score templates with K-vector boosting
	let bestMatch: { template: Template; score: number } | null = null;

	for (const template of TEMPLATES) {
		let score = 0;

		// Check triggers (highest weight)
		for (const trigger of template.triggers || []) {
			const triggerLower = trigger.toLowerCase();
			if (queryWords.has(triggerLower)) {
				score += 3; // Exact word match
			} else if (queryLower.includes(triggerLower)) {
				score += 1; // Substring match
			}
		}

		// Check name
		const name = (template.name || template.block_id || '').toLowerCase();
		if (queryLower.includes(name)) {
			score += 2;
		}

		// K-vector boosting: if template suit matches detected suit, boost score
		if (template.suit && template.suit.toLowerCase() === kVector.suit) {
			score += 2;
		}

		// Polarity boosting: if template polarity matches, boost
		if (template.polarity) {
			const templatePolarity = template.polarity === '+' ? 'light' : 'dark';
			if (templatePolarity === kVector.polarity) {
				score += 1;
			}
		}

		// Update best match
		if (score > 0 && (!bestMatch || score > bestMatch.score)) {
			bestMatch = { template, score };
		}
	}

	// Step 4: Decide action

	// IMPORTANT: Escalation takes priority over weak template matches
	// Knowledge questions should not return random templates
	if (needsEscalation) {
		// Only use template if it's VERY high confidence (score >= 5) AND directly relevant
		// Otherwise escalate to get accurate knowledge
		if (bestMatch && bestMatch.score >= 5) {
			const surfaces = bestMatch.template.surfaces || [];
			const surface = surfaces.length > 0
				? surfaces[Math.floor(Math.random() * surfaces.length)]
				: '[No surface available]';

			return {
				matched: true,
				template: bestMatch.template,
				surface,
				score: bestMatch.score,
				action: 'template',
				reason: `High-confidence template despite escalation signal (score: ${bestMatch.score}, K: ${formatKVector(kVector)})`,
				kVector
			};
		}

		// Escalate for knowledge questions (unless fully local mode)
		if (fullyLocalMode) {
			return {
				matched: false,
				score: bestMatch?.score || 0,
				action: 'generate',
				reason: `Knowledge question detected, but fully local mode — using local generation (K: ${formatKVector(kVector)})`,
				kVector
			};
		}

		return {
			matched: false,
			score: bestMatch?.score || 0,
			action: 'escalate',
			reason: `Knowledge question detected, escalating (K: ${formatKVector(kVector)})`,
			kVector
		};
	}

	// High-confidence template match (no escalation needed)
	if (bestMatch && bestMatch.score >= 3) {
		const surfaces = bestMatch.template.surfaces || [];
		const surface = surfaces.length > 0
			? surfaces[Math.floor(Math.random() * surfaces.length)]
			: '[No surface available]';

		return {
			matched: true,
			template: bestMatch.template,
			surface,
			score: bestMatch.score,
			action: 'template',
			reason: `Matched "${bestMatch.template.name}" (score: ${bestMatch.score}, K: ${formatKVector(kVector)})`,
			kVector
		};
	}

	// Lower-confidence match
	if (bestMatch && bestMatch.score >= 2) {
		const surfaces = bestMatch.template.surfaces || [];
		const surface = surfaces.length > 0
			? surfaces[Math.floor(Math.random() * surfaces.length)]
			: '[No surface available]';

		return {
			matched: true,
			template: bestMatch.template,
			surface,
			score: bestMatch.score,
			action: 'template',
			reason: `Matched "${bestMatch.template.name}" (score: ${bestMatch.score}, K: ${formatKVector(kVector)})`,
			kVector
		};
	}

	// Default: try local generation
	return {
		matched: false,
		score: bestMatch?.score || 0,
		action: 'generate',
		reason: `No template match, local generation (K: ${formatKVector(kVector)})`,
		kVector
	};
}

/**
 * Get a template response with optional voice.
 */
export function getTemplateResponse(template: Template, voice: 'default' | 'cat' | 'dog' | 'turtle' = 'default'): string {
	if (voice === 'cat' && template.cat_voice) return template.cat_voice;
	if (voice === 'dog' && template.dog_voice) return template.dog_voice;
	if (voice === 'turtle' && template.turtle_voice) return template.turtle_voice;

	const surfaces = template.surfaces || [];
	return surfaces.length > 0
		? surfaces[Math.floor(Math.random() * surfaces.length)]
		: '[No response available]';
}

/**
 * Quick route-and-respond. Returns surface or null if should generate.
 */
export function quickRoute(query: string): string | null {
	const result = route(query);
	if (result.matched && result.surface) {
		return result.surface;
	}
	return null;
}

/**
 * Get routing stats for display.
 */
export function getRoutingStats() {
	const history = getHistory();
	const templateCount = history.filter(t => t.source === 'template').length;
	const generateCount = history.filter(t => t.source === 'generation').length;
	const escalateCount = history.filter(t => t.source === 'escalation').length;

	return {
		total: history.length,
		templates: templateCount,
		generations: generateCount,
		escalations: escalateCount,
		templateRate: history.length > 0 ? (templateCount / history.length * 100).toFixed(0) : '0'
	};
}
