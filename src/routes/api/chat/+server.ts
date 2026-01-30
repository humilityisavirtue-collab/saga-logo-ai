import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PERSONAS, type PersonaMode } from '$lib/personas';

interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

interface ChatRequest {
	messages: ChatMessage[];
	persona: PersonaMode;
	apiKey: string;
	provider?: 'anthropic' | 'openai';
	model?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	const body: ChatRequest = await request.json();
	const { messages, persona, apiKey, provider = 'anthropic', model } = body;

	if (!apiKey) {
		throw error(400, 'API key required');
	}

	if (!messages || messages.length === 0) {
		throw error(400, 'Messages required');
	}

	const personaConfig = PERSONAS[persona];
	if (!personaConfig) {
		throw error(400, 'Invalid persona');
	}

	try {
		if (provider === 'anthropic') {
			return await callAnthropic(messages, personaConfig.systemPrompt, apiKey, model);
		} else {
			return await callOpenAI(messages, personaConfig.systemPrompt, apiKey, model);
		}
	} catch (e) {
		console.error('Chat API error:', e);
		throw error(500, e instanceof Error ? e.message : 'API call failed');
	}
};

async function callAnthropic(
	messages: ChatMessage[],
	systemPrompt: string,
	apiKey: string,
	model?: string
) {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: model || 'claude-sonnet-4-20250514',
			max_tokens: 4096,
			system: systemPrompt,
			messages: messages.map((m) => ({
				role: m.role,
				content: m.content
			}))
		})
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Anthropic API error: ${response.status} - ${errorBody}`);
	}

	const data = await response.json();
	const content = data.content?.[0]?.text || 'No response';

	return json({ content });
}

async function callOpenAI(
	messages: ChatMessage[],
	systemPrompt: string,
	apiKey: string,
	model?: string
) {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: model || 'gpt-4o',
			messages: [
				{ role: 'system', content: systemPrompt },
				...messages.map((m) => ({
					role: m.role,
					content: m.content
				}))
			]
		})
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content || 'No response';

	return json({ content });
}
