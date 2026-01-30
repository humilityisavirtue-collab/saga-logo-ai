import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface CompressRequest {
	messages: { role: string; content: string }[];
	apiKey: string;
	provider?: 'anthropic' | 'openai' | 'google';
}

const COMPRESS_PROMPT = `You are a memory compression system. Given a chat history, extract:

1. A compressed summary (2-3 sentences max) capturing the key topics, decisions, and emotional tone
2. Any concrete variables that should persist (user's name, project name, key preferences, important facts)

Respond in this exact format:
SUMMARY: [your compressed summary]
VARIABLES:
- key: value
- key: value

If no clear variables emerge, just provide the summary. Focus on what would help a future conversation pick up naturally.`;

export const POST: RequestHandler = async ({ request }) => {
	const body: CompressRequest = await request.json();
	const { messages, apiKey, provider = 'anthropic' } = body;

	if (!apiKey) {
		throw error(400, 'API key required');
	}

	if (!messages || messages.length === 0) {
		throw error(400, 'Messages required');
	}

	// Format chat history for compression
	const chatHistory = messages
		.map((m) => `${m.role.toUpperCase()}: ${m.content}`)
		.join('\n\n');

	const compressMessage = `${COMPRESS_PROMPT}\n\n---CHAT HISTORY---\n${chatHistory}`;

	try {
		let content: string;

		if (provider === 'anthropic') {
			const response = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify({
					model: 'claude-sonnet-4-20250514',
					max_tokens: 500,
					messages: [{ role: 'user', content: compressMessage }]
				})
			});

			if (!response.ok) {
				const errorBody = await response.text();
				throw new Error(`Anthropic API error: ${response.status} - ${errorBody}`);
			}

			const data = await response.json();
			content = data.content?.[0]?.text || '';
		} else if (provider === 'google') {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [{ role: 'user', parts: [{ text: compressMessage }] }],
						generationConfig: { maxOutputTokens: 500 }
					})
				}
			);

			if (!response.ok) {
				const errorBody = await response.text();
				throw new Error(`Google API error: ${response.status} - ${errorBody}`);
			}

			const data = await response.json();
			content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
		} else {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: 'gpt-4o-mini',
					max_tokens: 500,
					messages: [{ role: 'user', content: compressMessage }]
				})
			});

			if (!response.ok) {
				const errorBody = await response.text();
				throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
			}

			const data = await response.json();
			content = data.choices?.[0]?.message?.content || '';
		}

		// Parse the response
		const summaryMatch = content.match(/SUMMARY:\s*(.+?)(?=VARIABLES:|$)/s);
		const variablesMatch = content.match(/VARIABLES:\s*(.+)$/s);

		const summary = summaryMatch?.[1]?.trim() || content.trim();
		const variables: Record<string, string> = {};

		if (variablesMatch) {
			const varLines = variablesMatch[1].split('\n');
			for (const line of varLines) {
				const match = line.match(/^-\s*(.+?):\s*(.+)$/);
				if (match) {
					variables[match[1].trim()] = match[2].trim();
				}
			}
		}

		return json({ summary, variables });
	} catch (e) {
		console.error('Compression error:', e);
		throw error(500, e instanceof Error ? e.message : 'Compression failed');
	}
};
