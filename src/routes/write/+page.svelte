<script lang="ts">
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';
	import { chat, type Message } from '$lib/stores/chat';
	import { PERSONAS, type PersonaMode } from '$lib/personas';

	let mode: PersonaMode = $state('saga');
	let input = $state('');
	let loading = $state(false);
	let messages: Message[] = $state([]);
	let apiKey = $state('');

	// Subscribe to stores
	$effect(() => {
		const unsubChat = chat.subscribe((m) => (messages = m));
		const unsubSettings = settings.subscribe((s) => (apiKey = s.apiKey));
		return () => {
			unsubChat();
			unsubSettings();
		};
	});

	const persona = $derived(PERSONAS[mode]);

	async function sendMessage() {
		if (!input.trim() || loading) return;

		if (!apiKey) {
			goto('/settings');
			return;
		}

		const userMessage = input.trim();
		input = '';
		loading = true;

		chat.addMessage('user', userMessage);
		chat.addMessage('assistant', '...', mode);

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [...messages, { role: 'user', content: userMessage }],
					persona: mode,
					apiKey
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

	function toggleMode() {
		mode = mode === 'saga' ? 'logo' : 'saga';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<div class="min-h-screen flex flex-col {mode === 'saga' ? 'saga-mode' : 'logo-mode'} transition-all duration-500">
	<!-- Header -->
	<header class="flex items-center justify-between p-4 border-b border-white/10">
		<button onclick={() => goto('/')} class="text-[var(--text-muted)] hover:text-white transition-colors">
			← Back
		</button>

		<button
			onclick={toggleMode}
			class="flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300"
			style="border-color: {persona.color}; color: {persona.color}"
		>
			<span class="text-xl">{persona.icon}</span>
			<span class="font-medium">{persona.name}</span>
		</button>

		<button
			onclick={() => goto('/settings')}
			class="text-[var(--text-muted)] hover:text-white transition-colors"
		>
			Settings
		</button>
	</header>

	<!-- Chat area -->
	<main class="flex-1 overflow-y-auto p-4 space-y-4">
		{#if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full text-center">
				<span class="text-6xl mb-4">{persona.icon}</span>
				<h2 class="text-2xl font-semibold mb-2" style="color: {persona.color}">{persona.name}</h2>
				<p class="text-[var(--text-muted)] max-w-md">{persona.tagline}</p>
				<p class="text-[var(--text-muted)] mt-4 text-sm max-w-lg">
					{#if mode === 'saga'}
						Share what you're working on. Let's explore where it wants to go.
					{:else}
						Paste your text. Let's make it tighter.
					{/if}
				</p>
			</div>
		{:else}
			{#each messages as message}
				<div class="max-w-3xl mx-auto {message.role === 'user' ? 'text-right' : 'text-left'}">
					<div
						class="inline-block rounded-2xl px-4 py-3 max-w-[85%] {message.role === 'user'
							? 'bg-white/10'
							: 'bg-[var(--bg-card)]'}"
					>
						{#if message.role === 'assistant' && message.persona}
							<div class="text-xs mb-1 opacity-60" style="color: {PERSONAS[message.persona].color}">
								{PERSONAS[message.persona].name}
							</div>
						{/if}
						<div class="whitespace-pre-wrap">{message.content}</div>
					</div>
				</div>
			{/each}
		{/if}
	</main>

	<!-- Input area -->
	<footer class="p-4 border-t border-white/10">
		<div class="max-w-3xl mx-auto flex gap-2">
			<textarea
				bind:value={input}
				onkeydown={handleKeydown}
				placeholder={mode === 'saga' ? "What are you working on?" : "Paste text to edit..."}
				rows="3"
				class="flex-1 bg-[var(--bg-card)] border border-white/10 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
			></textarea>
			<button
				onclick={sendMessage}
				disabled={loading || !input.trim()}
				class="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
				style="background-color: {persona.color}"
			>
				{loading ? '...' : 'Send'}
			</button>
		</div>
		{#if !apiKey}
			<p class="text-center text-sm text-[var(--gold)] mt-2">
				<a href="/settings" class="underline">Add your API key</a> to start writing
			</p>
		{/if}
	</footer>
</div>
