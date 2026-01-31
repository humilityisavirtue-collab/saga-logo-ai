<script lang="ts">
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';
	import { chat, type Message } from '$lib/stores/chat';
	import { memory, type UserMemory } from '$lib/stores/memory';
	import { PERSONAS, type PersonaMode } from '$lib/personas';
	import Editor from '$lib/components/Editor.svelte';

	let mode: PersonaMode = $state('saga');
	let input = $state('');
	let loading = $state(false);
	let messages: Message[] = $state([]);
	let apiKey = $state('');
	let provider = $state<'anthropic' | 'openai' | 'google'>('anthropic');
	let model = $state('');
	let editorComponent: Editor;
	let showEditor = $state(true);
	let messagesContainer: HTMLElement;
	let userMemory: UserMemory = $state({ summary: '', variables: {}, lastUpdated: 0 });
	let showMemory = $state(false);
	let compressing = $state(false);
	let showKeyModal = $state(false);
	let tempKey = $state('');

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

	const persona = $derived(PERSONAS[mode]);

	async function sendMessage() {
		if (!input.trim() || loading) return;

		if (!apiKey) {
			showKeyModal = true;
			return;
		}

		const userMessage = input.trim();
		input = '';
		loading = true;

		// Include document context if there's content in the editor
		const docContent = editorComponent?.getText() || '';
		const memoryContext = memory.getContextString(userMemory);

		let contextMessage = userMessage;
		const contextParts: string[] = [];

		if (memoryContext) {
			contextParts.push(`[Persistent Memory]\n${memoryContext}`);
		}
		if (docContent.trim()) {
			contextParts.push(`[Current document]\n${docContent.slice(0, 2000)}${docContent.length > 2000 ? '...' : ''}`);
		}

		if (contextParts.length > 0) {
			contextMessage = `${contextParts.join('\n\n---\n\n')}\n\n---\n\nUser message: ${userMessage}`;
		}

		chat.addMessage('user', userMessage);
		chat.addMessage('assistant', '...', mode);

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [...messages, { role: 'user', content: contextMessage }],
					persona: mode,
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

			// Parse for editor content
			const editorDelimiter = '---EDITOR---';
			if (data.content.includes(editorDelimiter)) {
				const [chatContent, editorContent] = data.content.split(editorDelimiter);
				chat.updateLastMessage(chatContent.trim());
				if (editorContent?.trim() && editorComponent) {
					editorComponent.appendText('\n\n' + editorContent.trim());
				}
			} else {
				chat.updateLastMessage(data.content);
			}
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

	async function compressSession() {
		if (messages.length < 2 || compressing) return;

		compressing = true;
		try {
			const response = await fetch('/api/compress', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: messages.map((m) => ({ role: m.role, content: m.content })),
					apiKey,
					provider
				})
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			const data = await response.json();
			memory.setSummary(data.summary);

			// Merge new variables with existing
			for (const [key, value] of Object.entries(data.variables)) {
				memory.setVariable(key, value as string);
			}

			// Clear chat after compression
			chat.clear();

			alert('Session compressed and saved. Chat cleared for fresh start.');
		} catch (e) {
			console.error('Compression failed:', e);
			alert('Failed to compress session: ' + (e instanceof Error ? e.message : 'Unknown error'));
		} finally {
			compressing = false;
		}
	}

	function clearMemory() {
		if (confirm('Clear all memory? This removes your session history and stored variables.')) {
			memory.clear();
		}
	}

	function saveQuickKey() {
		if (tempKey.trim()) {
			// Default to OpenRouter for quick setup (free tier)
			settings.update(s => ({
				...s,
				apiKey: tempKey.trim(),
				openrouterKey: tempKey.trim(),
				apiProvider: 'openrouter',
				model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free'
			}));
			apiKey = tempKey.trim();
			provider = 'openrouter';
			showKeyModal = false;
			tempKey = '';
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
				onclick={() => showMemory = !showMemory}
				class="text-sm px-3 py-1 rounded border transition-colors {userMemory.summary || Object.keys(userMemory.variables).length ? 'border-[var(--gold)] text-[var(--gold)]' : 'border-white/20 text-[var(--text-muted)]'} hover:border-white/40"
				title="View/manage persistent memory"
			>
				Memory {userMemory.summary ? '●' : ''}
			</button>
			<button
				onclick={() => goto('/settings')}
				class="text-[var(--text-muted)] hover:text-white transition-colors"
			>
				Settings
			</button>
		</div>
	</header>

	<!-- Memory Panel (slides down) -->
	{#if showMemory}
		<div class="border-b border-white/10 bg-[var(--bg-card)] p-4 space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-medium text-[var(--gold)]">Persistent Memory</h3>
				<div class="flex gap-2">
					<button
						onclick={compressSession}
						disabled={messages.length < 2 || compressing}
						class="text-xs px-2 py-1 rounded border border-[var(--gold)]/50 text-[var(--gold)] hover:border-[var(--gold)] disabled:opacity-50 transition-colors"
					>
						{compressing ? 'Compressing...' : 'Close & Save Session'}
					</button>
					<button
						onclick={clearMemory}
						class="text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:border-red-500/60 transition-colors"
					>
						Clear Memory
					</button>
				</div>
			</div>

			{#if userMemory.summary}
				<div>
					<p class="text-xs text-[var(--text-muted)] mb-1">Session Summary:</p>
					<p class="text-sm text-[var(--text-primary)] bg-white/5 rounded p-2">{userMemory.summary}</p>
				</div>
			{/if}

			{#if Object.keys(userMemory.variables).length > 0}
				<div>
					<p class="text-xs text-[var(--text-muted)] mb-1">Stored Variables:</p>
					<div class="flex flex-wrap gap-2">
						{#each Object.entries(userMemory.variables) as [key, value]}
							<span class="text-xs bg-white/10 rounded px-2 py-1">
								<span class="text-[var(--text-muted)]">{key}:</span> {value}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if !userMemory.summary && Object.keys(userMemory.variables).length === 0}
				<p class="text-sm text-[var(--text-muted)]">
					No memory yet. Have a conversation, then click "Close & Save Session" to compress it.
				</p>
			{/if}
		</div>
	{/if}

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
						<button onclick={() => showKeyModal = true} class="underline">Add your API key</button> to start (free)
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

<!-- API Key Modal -->
{#if showKeyModal}
	<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
		<div class="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full space-y-4">
			<h2 class="text-xl font-semibold">Quick Start</h2>
			<p class="text-sm text-[var(--text-muted)]">
				Get a free API key from <a href="https://openrouter.ai/keys" target="_blank" class="text-[var(--gold)] underline">OpenRouter</a> (takes 30 seconds)
			</p>

			<input
				type="password"
				bind:value={tempKey}
				placeholder="sk-or-..."
				class="w-full bg-[var(--bg-dark)] border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
				onkeydown={(e) => e.key === 'Enter' && saveQuickKey()}
			/>

			<div class="flex gap-2">
				<button
					onclick={() => showKeyModal = false}
					class="flex-1 py-2 rounded-lg border border-white/20 text-[var(--text-muted)] hover:border-white/40 transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={saveQuickKey}
					disabled={!tempKey.trim()}
					class="flex-1 py-2 rounded-lg bg-[var(--gold)] text-[var(--bg-dark)] font-medium disabled:opacity-50 transition-colors"
				>
					Start Free
				</button>
			</div>

			<p class="text-xs text-[var(--text-muted)] text-center">
				Or <a href="/settings" class="text-[var(--gold)] underline">go to settings</a> for more providers
			</p>
		</div>
	</div>
{/if}
