<script lang="ts">
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';
	import { chat, type Message } from '$lib/stores/chat';
	import { PERSONAS, type PersonaMode } from '$lib/personas';
	import Editor from '$lib/components/Editor.svelte';

	let mode: PersonaMode = $state('saga');
	let input = $state('');
	let loading = $state(false);
	let messages: Message[] = $state([]);
	let apiKey = $state('');
	let editorComponent: Editor;
	let showEditor = $state(true);
	let messagesContainer: HTMLElement;

	// Subscribe to stores
	$effect(() => {
		const unsubChat = chat.subscribe((m) => {
			messages = m;
			// Auto-scroll to bottom
			setTimeout(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}, 50);
		});
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

		// Include document context if there's content in the editor
		const docContent = editorComponent?.getText() || '';
		const contextMessage = docContent.trim()
			? `[Current document content for context]\n---\n${docContent.slice(0, 2000)}${docContent.length > 2000 ? '...' : ''}\n---\n\nUser message: ${userMessage}`
			: userMessage;

		chat.addMessage('user', userMessage);
		chat.addMessage('assistant', '...', mode);

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [...messages, { role: 'user', content: contextMessage }],
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

	function copyToEditor() {
		// Copy selected text from last assistant message to editor
		const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
		if (lastAssistant && editorComponent) {
			editorComponent.appendText('\n\n' + lastAssistant.content);
		}
	}

	function exportDocument() {
		const content = editorComponent?.getContent() || '';
		const blob = new Blob([content], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'story.html';
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportText() {
		const content = editorComponent?.getText() || '';
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'story.txt';
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportMarkdown() {
		const content = editorComponent?.getMarkdown() || '';
		const blob = new Blob([content], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'story.md';
		a.click();
		URL.revokeObjectURL(url);
	}

	let copySuccess = $state(false);
	async function copyToClipboard() {
		const content = editorComponent?.getText() || '';
		try {
			await navigator.clipboard.writeText(content);
			copySuccess = true;
			setTimeout(() => copySuccess = false, 2000);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}

	function clearDocument() {
		if (confirm('Clear the document? This cannot be undone.')) {
			editorComponent?.clear();
		}
	}
</script>

<div class="h-screen flex flex-col {mode === 'saga' ? 'saga-mode' : 'logo-mode'} transition-all duration-500">
	<!-- Header -->
	<header class="flex items-center justify-between p-3 border-b border-white/10 shrink-0">
		<div class="flex items-center gap-4">
			<button onclick={() => goto('/')} class="text-[var(--text-muted)] hover:text-white transition-colors">
				← Back
			</button>
			<button
				onclick={() => showEditor = !showEditor}
				class="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/40 transition-colors {showEditor ? 'bg-white/10' : ''}"
			>
				{showEditor ? 'Hide Editor' : 'Show Editor'}
			</button>
		</div>

		<button
			onclick={toggleMode}
			class="flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300"
			style="border-color: {persona.color}; color: {persona.color}"
		>
			<span class="text-xl">{persona.icon}</span>
			<span class="font-medium">{persona.name}</span>
		</button>

		<div class="flex items-center gap-2">
			{#if showEditor}
				<button
					onclick={copyToClipboard}
					class="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/40 transition-colors"
				>
					{copySuccess ? 'Copied!' : 'Copy'}
				</button>
				<button
					onclick={exportMarkdown}
					class="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/40 transition-colors"
				>
					.md
				</button>
				<button
					onclick={exportText}
					class="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/40 transition-colors"
				>
					.txt
				</button>
				<button
					onclick={clearDocument}
					class="text-sm px-3 py-1 rounded border border-red-500/30 hover:border-red-500/60 text-red-400 transition-colors"
					title="Clear document"
				>
					Clear
				</button>
			{/if}
			<button
				onclick={() => goto('/settings')}
				class="text-[var(--text-muted)] hover:text-white transition-colors"
			>
				Settings
			</button>
		</div>
	</header>

	<!-- Main split panel -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left: Chat -->
		<div class="flex flex-col {showEditor ? 'w-1/2 border-r border-white/10' : 'w-full'}">
			<!-- Messages -->
			<main bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4 space-y-4">
				{#if messages.length === 0}
					<div class="flex flex-col items-center justify-center h-full text-center">
						<span class="text-5xl mb-3">{persona.icon}</span>
						<h2 class="text-xl font-semibold mb-1" style="color: {persona.color}">{persona.name}</h2>
						<p class="text-[var(--text-muted)] text-sm">{persona.tagline}</p>
						<p class="text-[var(--text-muted)] mt-3 text-xs max-w-md">
							{#if mode === 'saga'}
								Share what you're working on. Let's explore where it wants to go.
							{:else}
								Paste your text. Let's make it tighter.
							{/if}
						</p>
					</div>
				{:else}
					{#each messages as message}
						<div class="{message.role === 'user' ? 'text-right' : 'text-left'}">
							<div
								class="inline-block rounded-2xl px-4 py-3 max-w-[90%] {message.role === 'user'
									? 'bg-white/10'
									: 'bg-[var(--bg-card)]'}"
							>
								{#if message.role === 'assistant' && message.persona}
									<div class="text-xs mb-1 opacity-60 flex items-center gap-2" style="color: {PERSONAS[message.persona].color}">
										<span>{PERSONAS[message.persona].name}</span>
										{#if showEditor && message.content !== '...'}
											<button
												onclick={copyToEditor}
												class="opacity-50 hover:opacity-100 text-[10px] border border-current rounded px-1"
											>
												→ Editor
											</button>
										{/if}
									</div>
								{/if}
								<div class="whitespace-pre-wrap text-sm">{message.content}</div>
							</div>
						</div>
					{/each}
				{/if}
			</main>

			<!-- Input -->
			<footer class="p-3 border-t border-white/10 shrink-0">
				<div class="flex gap-2">
					<textarea
						bind:value={input}
						onkeydown={handleKeydown}
						placeholder={mode === 'saga' ? "What are you working on?" : "Paste text to edit..."}
						rows="2"
						class="flex-1 bg-[var(--bg-card)] border border-white/10 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm"
					></textarea>
					<button
						onclick={sendMessage}
						disabled={loading || !input.trim()}
						class="px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 text-sm"
						style="background-color: {persona.color}"
					>
						{loading ? '...' : 'Send'}
					</button>
				</div>
				{#if !apiKey}
					<p class="text-center text-xs text-[var(--gold)] mt-2">
						<a href="/settings" class="underline">Add your API key</a> to start
					</p>
				{/if}
			</footer>
		</div>

		<!-- Right: Editor -->
		{#if showEditor}
			<div class="w-1/2 p-4 flex flex-col">
				<div class="flex items-center justify-between mb-2">
					<h3 class="text-sm font-medium text-[var(--text-muted)]">Document</h3>
					<span class="text-xs text-[var(--text-muted)]">Auto-saves locally</span>
				</div>
				<div class="flex-1">
					<Editor bind:this={editorComponent} />
				</div>
			</div>
		{/if}
	</div>
</div>
