// K-Router — Template-first routing for the K-Stack
// Route queries through templates BEFORE generation
// The scaffold does the knowing, the model does the speaking

import { TEMPLATES, type Template } from './templates';

export interface RouteResult {
	matched: boolean;
	template?: Template;
	surface?: string;
	score: number;
	action: 'template' | 'generate' | 'escalate';
	reason: string;
}

/**
 * Route a query through the K-Stack template corpus.
 * Returns a template match if found, or signals to generate.
 */
export function route(query: string): RouteResult {
	const queryLower = query.toLowerCase();
	const queryWords = new Set(queryLower.split(/\s+/));

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

		// Update best match
		if (score > 0 && (!bestMatch || score > bestMatch.score)) {
			bestMatch = { template, score };
		}
	}

	// Threshold: need decent match to use template
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
			reason: `Matched "${bestMatch.template.name}" (score: ${bestMatch.score})`
		};
	}

	// Check for escalation signals (questions requiring real knowledge)
	const escalateSignals = ['how does', 'what is', 'explain', 'why is', 'tell me about', 'define'];
	const needsKnowledge = escalateSignals.some(sig => queryLower.includes(sig));

	if (needsKnowledge) {
		return {
			matched: false,
			score: 0,
			action: 'generate',
			reason: 'Query requires generation (knowledge question)'
		};
	}

	// Default: try generation
	return {
		matched: false,
		score: 0,
		action: 'generate',
		reason: 'No template match, falling back to generation'
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
