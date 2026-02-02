import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Local K-Stack endpoint
 *
 * This calls the local cat_purr system.
 * In production, this would call the actual Python backend.
 * For demo, we can either:
 * 1. Call a local Python server running cat_purr
 * 2. Call Ollama directly with the scaffold prompt
 * 3. Return mock responses for demo purposes
 */

const LOCAL_BACKEND = process.env.KSTACK_URL || 'http://localhost:8420';

export const POST: RequestHandler = async ({ request }) => {
	const { message } = await request.json();

	if (!message) {
		return json({ error: 'No message provided' }, { status: 400 });
	}

	try {
		// Try to call the local K-Stack backend
		const response = await fetch(`${LOCAL_BACKEND}/purr`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: message }),
			signal: AbortSignal.timeout(30000)
		});

		if (response.ok) {
			const data = await response.json();
			return json({
				content: data.output || data.response || data.content,
				card: data.card,
				sources: data.sources,
				kvector: data.kvector
			});
		}

		// Fallback: try Ollama directly with K-scaffold prompt
		return await callOllamaFallback(message);

	} catch (e) {
		// If local backend unavailable, try Ollama fallback
		console.log('Local backend unavailable, trying Ollama fallback');
		return await callOllamaFallback(message);
	}
};

async function callOllamaFallback(message: string) {
	const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
	const MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

	// K-Scaffold system prompt
	const systemPrompt = `You are a helpful assistant running through the K-Stack scaffold.
Your responses should be:
- Clear and direct
- Honest about uncertainty (say "I'm not sure" rather than guessing)
- Concise but complete

If you don't know something, say so. Never make up facts or citations.`;

	try {
		const response = await fetch(`${OLLAMA_URL}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: MODEL,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: message }
				],
				stream: false
			}),
			signal: AbortSignal.timeout(60000)
		});

		if (!response.ok) {
			throw new Error(`Ollama error: ${response.status}`);
		}

		const data = await response.json();
		return json({
			content: data.message?.content || '[No response from local model]',
			model: MODEL,
			source: 'ollama'
		});

	} catch (e) {
		// Final fallback: demo mode
		return json({
			content: getDemoResponse(message),
			source: 'demo'
		});
	}
}

function getDemoResponse(message: string): string {
	// Simple demo responses for when no backend is available
	const lower = message.toLowerCase();

	if (lower.includes('hello') || lower.includes('hi')) {
		return "Hello! I'm running on the local K-Stack. How can I help you today?";
	}

	if (lower.includes('who are you') || lower.includes('what are you')) {
		return "I'm an AI assistant running through the K-Stack scaffold on a local Gemma model. My responses are routed through a template selection system that prioritizes accuracy over generation.";
	}

	if (lower.includes('hallucin')) {
		return "The K-Stack architecture is designed to minimize hallucination by using template selection instead of open generation. When I don't have a good match, I say so rather than making something up.";
	}

	if (lower.includes('cost') || lower.includes('price') || lower.includes('money')) {
		return "The entire K-Stack was developed for approximately $320 in API costs. Inference runs locally at essentially zero marginal cost.";
	}

	if (lower.includes('how does') || lower.includes('how do you')) {
		return "The K-Stack uses a routing system based on symbolic mapping. Input is classified and routed to appropriate template responses, which are then composed and returned. No token-by-token generation means no hallucination accumulation.";
	}

	// Default response
	return `I understand you're asking about: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"

This is a demonstration of the K-Stack local inference. In production, this would route through the full cat_purr system with tarot-based attention routing and template composition.

Key benefits:
• Zero hallucination (selection, not generation)
• Zero API cost (runs locally)
• Instant response (no token generation delay)`;
}
