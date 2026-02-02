import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Opus API endpoint
 *
 * Calls the Anthropic API with Claude Opus for comparison.
 * Tracks token usage and returns it for cost calculation.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export const POST: RequestHandler = async ({ request }) => {
	const { message, apiKey, history = [], model } = await request.json();

	if (!message) {
		return json({ error: 'No message provided' }, { status: 400 });
	}

	// Use provided key or fall back to env
	const key = apiKey || process.env.ANTHROPIC_API_KEY;

	if (!key) {
		return json({
			error: 'No API key provided',
			content: '[No API key - configure in settings or set ANTHROPIC_API_KEY]',
			usage: { input_tokens: 0, output_tokens: 0 }
		}, { status: 400 });
	}

	// Default to Opus for comparison, allow override for escalation
	const selectedModel = model || 'claude-opus-4-20250514';

	try {
		// Build messages array from history
		const messages = [
			...history.map((m: {role: string, content: string}) => ({
				role: m.role,
				content: m.content
			})),
			{ role: 'user', content: message }
		];

		const response = await fetch(ANTHROPIC_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': key,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: selectedModel,
				max_tokens: 1024,
				messages: messages
			}),
			signal: AbortSignal.timeout(60000)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Anthropic API error:', errorText);
			return json({
				error: `API error: ${response.status}`,
				content: `[Opus API Error: ${response.status}]`,
				usage: { input_tokens: 0, output_tokens: 0 }
			}, { status: response.status });
		}

		const data = await response.json();

		// Extract content from response
		const content = data.content?.[0]?.text || '[No response]';

		// Extract usage for cost tracking
		const usage = {
			input_tokens: data.usage?.input_tokens || 0,
			output_tokens: data.usage?.output_tokens || 0
		};

		return json({
			content,
			usage,
			model: data.model,
			stop_reason: data.stop_reason
		});

	} catch (e) {
		console.error('Opus API call failed:', e);
		return json({
			error: e instanceof Error ? e.message : 'Unknown error',
			content: `[Error calling Opus: ${e instanceof Error ? e.message : 'Unknown'}]`,
			usage: { input_tokens: 0, output_tokens: 0 }
		}, { status: 500 });
	}
};
