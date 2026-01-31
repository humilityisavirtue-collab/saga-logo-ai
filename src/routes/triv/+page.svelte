<script lang="ts">
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';
	import { chat, type Message } from '$lib/stores/chat';
	import { memory, type UserMemory } from '$lib/stores/memory';
	import { PERSONAS } from '$lib/personas';
	import { onMount } from 'svelte';

	let input = $state('');
	let loading = $state(false);
	let messages: Message[] = $state([]);
	let apiKey = $state('');
	let provider = $state<'anthropic' | 'openai' | 'google'>('anthropic');
	let model = $state('');
	let messagesContainer: HTMLElement;
	let userMemory: UserMemory = $state({ summary: '', variables: {}, lastUpdated: 0 });

	const persona = PERSONAS.triv;

	onMount(() => {
		const unsubChat = chat.subscribe((m) => {
			messages = m;
			setTimeout(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}, 50);
		});
		const unsubSettings = settings.subscribe((s) => {
			apiKey = s.apiKey;
			provider = s.apiProvider;
			model = s.model;
		});
		const unsubMemory = memory.subscribe((m) => (userMemory = m));

		return () => {
			unsubChat();
			unsubSettings();
			unsubMemory();
		};
	});

	async function sendMessage() {
		if (!input.trim() || loading) return;

		if (!apiKey) {
			goto('/settings');
			return;
		}

		const userMessage = input.trim();
		input = '';
		loading = true;

		const memoryContext = memory.getContextString(userMemory);
		let contextMessage = userMessage;

		if (memoryContext) {
			contextMessage = `[Persistent Memory]\n${memoryContext}\n\n---\n\nKit: ${userMessage}`;
		}

		chat.addMessage('user', userMessage);
		chat.addMessage('assistant', '...', 'triv');

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [...messages, { role: 'user', content: contextMessage }],
					persona: 'triv',
					apiKey,
					provider,
					model
				})
			});

			if (!response.ok) {
				const error = await response.text();
				chat.updateLastMessage(`Error: ${error}`);
				return;
			}

			const data = await response.json();
			chat.updateLastMessage(data.content);
		} catch (e) {
			chat.updateLastMessage(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function clearChat() {
		if (confirm('Clear the conversation?')) {
			chat.clear();
		}
	}
</script>

<div class="h-screen flex flex-col bg-[var(--bg-dark)]">
	<!-- Header -->
	<header class="flex items-center justify-between p-3 border-b border-[var(--gold)]/20 shrink-0">
		<div class="flex items-center gap-3">
			<span class="text-2xl">🦊</span>
			<span class="font-medium text-[var(--gold)]">Triv</span>
			<span class="text-xs text-[var(--text-muted)]">Strategy Mode</span>
		</div>

		<div class="flex items-center gap-2">
			<button
				onclick={clearChat}
				class="text-xs px-2 py-1 rounded border border-white/20 hover:border-white/40 text-[var(--text-muted)] transition-colors"
			>
				Clear
			</button>
			<button
				onclick={() => goto('/settings')}
				class="text-[var(--text-muted)] hover:text-white transition-colors text-sm"
			>
				Settings
			</button>
		</div>
	</header>

	<!-- Messages -->
	<main bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4 space-y-4">
		{#if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full text-center">
				<span class="text-6xl mb-4">🦊</span>
				<h2 class="text-xl font-semibold mb-2 text-[var(--gold)]">Hey Kit</h2>
				<p class="text-[var(--text-muted)] text-sm max-w-md">
					What are we building today?
				</p>
			</div>
		{:else}
			{#each messages as message}
				<div class="{message.role === 'user' ? 'text-right' : 'text-left'}">
					<div
						class="inline-block rounded-2xl px-4 py-3 max-w-[85%] {message.role === 'user'
							? 'bg-[var(--gold)]/10 border border-[var(--gold)]/30'
							: 'bg-[var(--bg-card)]'}"
					>
						{#if message.role === 'assistant'}
							<div class="text-xs mb-1 text-[var(--gold)]">🦊 Triv</div>
						{/if}
						<div class="whitespace-pre-wrap text-sm">{message.content}</div>
					</div>
				</div>
			{/each}
		{/if}
	</main>

	<!-- Input -->
	<footer class="p-3 border-t border-[var(--gold)]/20 shrink-0">
		<div class="flex gap-2 max-w-4xl mx-auto">
			<textarea
				bind:value={input}
				onkeydown={handleKeydown}
				placeholder="What's the play?"
				rows="2"
				class="flex-1 bg-[var(--bg-card)] border border-[var(--gold)]/30 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
			></textarea>
			<button
				onclick={sendMessage}
				disabled={loading || !input.trim()}
				class="px-5 py-2 rounded-xl font-medium transition-all disabled:opacity-50 bg-[var(--gold)] text-[var(--bg-dark)]"
			>
				{loading ? '...' : '→'}
			</button>
		</div>
		{#if !apiKey}
			<p class="text-center text-xs text-[var(--gold)] mt-2">
				<a href="/settings" class="underline">Add your API key</a> to start
			</p>
		{/if}
	</footer>
</div>
