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
	provider?: 'anthropic' | 'openai' | 'google' | 'openrouter';
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

	// Filter out empty messages and limit history to prevent overflow
	const filteredMessages = messages
		.filter((m) => m.content && m.content.trim())
		.slice(-20); // Keep last 20 messages max

	if (filteredMessages.length === 0) {
		throw error(400, 'No valid messages');
	}

	const personaConfig = PERSONAS[persona];
	if (!personaConfig) {
		throw error(400, 'Invalid persona');
	}

	try {
		if (provider === 'anthropic') {
			return await callAnthropic(filteredMessages, personaConfig.systemPrompt, apiKey, model);
		} else if (provider === 'google') {
			return await callGoogle(filteredMessages, personaConfig.systemPrompt, apiKey, model);
		} else if (provider === 'openrouter') {
			return await callOpenRouter(filteredMessages, personaConfig.systemPrompt, apiKey, model);
		} else {
			return await callOpenAI(filteredMessages, personaConfig.systemPrompt, apiKey, model);
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

async function callGoogle(
	messages: ChatMessage[],
	systemPrompt: string,
	apiKey: string,
	model?: string
) {
	const modelId = model || 'gemini-2.0-flash';

	// Format messages for Gemini API
	const contents = messages.map((m) => ({
		role: m.role === 'assistant' ? 'model' : 'user',
		parts: [{ text: m.content }]
	}));

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				contents,
				systemInstruction: {
					parts: [{ text: systemPrompt }]
				},
				generationConfig: {
					maxOutputTokens: 4096
				}
			})
		}
	);

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Google API error: ${response.status} - ${errorBody}`);
	}

	const data = await response.json();
	const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

	return json({ content });
}

async function callOpenRouter(
	messages: ChatMessage[],
	systemPrompt: string,
	apiKey: string,
	model?: string
) {
	const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
			'HTTP-Referer': 'https://saga-logo-ai.vercel.app',
			'X-Title': 'Saga.Logo.AI'
		},
		body: JSON.stringify({
			model: model || 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
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
		throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content || 'No response';

	return json({ content });
}
