<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { localAI, LOCAL_MODELS, type LocalModelKey } from '$lib/localAI';

	// State
	let input = $state('');
	let loading = $state(false);
	let revealed = $state(false);
	let apiKey = $state('');
	let showKeyModal = $state(false);
	let tempKey = $state('');

	// Messages for each side
	let messagesA: Array<{role: string, content: string}> = $state([]);
	let messagesB: Array<{role: string, content: string}> = $state([]);

	// Stats
	let statsA = $state({ cost: 0, tokens: 0, latency: 0, queries: 0 });
	let statsB = $state({ cost: 0, tokens: 0, latency: 0, queries: 0 });

	// Which side is which (randomized)
	let localIsA = $state(Math.random() > 0.5);

	// Scrolling
	let containerA: HTMLElement;
	let containerB: HTMLElement;

	// Local AI state
	let aiState = $state($localAI);
	$effect(() => {
		const unsub = localAI.subscribe(s => { aiState = s; });
		return unsub;
	});

	// Opus pricing (per 1M tokens)
	const OPUS_INPUT_PRICE = 15;
	const OPUS_OUTPUT_PRICE = 75;

	$effect(() => {
		const unsub = settings.subscribe(s => {
			apiKey = s.anthropicKey || s.apiKey;
		});
		return unsub;
	});

	onMount(async () => {
		// Check WebGPU availability on mount
		await localAI.checkAvailability();
	});

	function saveApiKey() {
		if (tempKey.trim()) {
			settings.update(s => ({
				...s,
				apiKey: tempKey.trim(),
				anthropicKey: tempKey.trim()
			}));
			apiKey = tempKey.trim();
			showKeyModal = false;
			tempKey = '';
		}
	}

	function scrollToBottom() {
		setTimeout(() => {
			if (containerA) containerA.scrollTop = containerA.scrollHeight;
			if (containerB) containerB.scrollTop = containerB.scrollHeight;
		}, 50);
	}

	async function loadLocalModel() {
		await localAI.loadModel();
	}

	async function sendMessage() {
		if (!input.trim() || loading) return;

		// Need API key for Opus side
		if (!apiKey) {
			showKeyModal = true;
			return;
		}

		// Need local model loaded
		if (!aiState.ready) {
			await loadLocalModel();
			if (!$localAI.ready) return;
		}

		const userMessage = input.trim();
		input = '';
		loading = true;

		// Add user message to both
		messagesA = [...messagesA, { role: 'user', content: userMessage }];
		messagesB = [...messagesB, { role: 'user', content: userMessage }];

		// Add placeholder responses
		messagesA = [...messagesA, { role: 'assistant', content: '...' }];
		messagesB = [...messagesB, { role: 'assistant', content: '...' }];
		scrollToBottom();

		// Fire both requests
		const [localResult, opusResult] = await Promise.all([
			callLocal(userMessage),
			callOpus(userMessage)
		]);

		// Update based on which side is which
		if (localIsA) {
			messagesA[messagesA.length - 1] = { role: 'assistant', content: localResult.content };
			messagesB[messagesB.length - 1] = { role: 'assistant', content: opusResult.content };
			statsA = {
				cost: statsA.cost,
				tokens: statsA.tokens,
				latency: localResult.latency,
				queries: statsA.queries + 1
			};
			statsB = {
				cost: statsB.cost + opusResult.cost,
				tokens: statsB.tokens + opusResult.tokens,
				latency: opusResult.latency,
				queries: statsB.queries + 1
			};
		} else {
			messagesA[messagesA.length - 1] = { role: 'assistant', content: opusResult.content };
			messagesB[messagesB.length - 1] = { role: 'assistant', content: localResult.content };
			statsA = {
				cost: statsA.cost + opusResult.cost,
				tokens: statsA.tokens + opusResult.tokens,
				latency: opusResult.latency,
				queries: statsA.queries + 1
			};
			statsB = {
				cost: statsB.cost,
				tokens: statsB.tokens,
				latency: localResult.latency,
				queries: statsB.queries + 1
			};
		}

		messagesA = [...messagesA];
		messagesB = [...messagesB];
		scrollToBottom();
		loading = false;
	}

	async function callLocal(message: string): Promise<{content: string, latency: number}> {
		// Use browser-based WebLLM - runs entirely on this device
		const result = await localAI.chat(message);

		if (result.success) {
			return {
				content: result.content,
				latency: result.latency || 0
			};
		} else {
			return {
				content: `[Local error: ${result.error}]`,
				latency: 0
			};
		}
	}

	async function callOpus(message: string): Promise<{content: string, tokens: number, cost: number, latency: number}> {
		const start = performance.now();
		try {
			const response = await fetch('/api/jema/opus', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message,
					apiKey,
					history: (localIsA ? messagesB : messagesA).filter(m => m.content !== '...')
				})
			});
			const data = await response.json();
			const inputTokens = data.usage?.input_tokens || 0;
			const outputTokens = data.usage?.output_tokens || 0;
			const totalTokens = inputTokens + outputTokens;
			const cost = (inputTokens * OPUS_INPUT_PRICE / 1_000_000) + (outputTokens * OPUS_OUTPUT_PRICE / 1_000_000);

			return {
				content: data.content || '[No response]',
				tokens: totalTokens,
				cost: cost,
				latency: performance.now() - start
			};
		} catch (e) {
			return {
				content: `[Error: ${e instanceof Error ? e.message : 'Unknown'}]`,
				tokens: 0,
				cost: 0,
				latency: performance.now() - start
			};
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function reveal() {
		revealed = true;
	}

	function reset() {
		messagesA = [];
		messagesB = [];
		statsA = { cost: 0, tokens: 0, latency: 0, queries: 0 };
		statsB = { cost: 0, tokens: 0, latency: 0, queries: 0 };
		localIsA = Math.random() > 0.5;
		revealed = false;
	}

	function formatCost(cost: number): string {
		return cost < 0.01 ? cost.toFixed(4) : cost.toFixed(2);
	}

	function formatTokens(tokens: number): string {
		if (tokens >= 1_000_000) return (tokens / 1_000_000).toFixed(2) + 'M';
		if (tokens >= 1_000) return (tokens / 1_000).toFixed(1) + 'K';
		return tokens.toString();
	}
</script>

<svelte:head>
	<title>K-Stack Demo | Browser vs API</title>
</svelte:head>

<div class="h-screen flex flex-col bg-[#0a0a0f] text-white">
	<!-- Header -->
	<header class="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
		<div class="flex items-center gap-4">
			<a href="/" class="text-slate-400 hover:text-white transition-colors">← Back</a>
			<h1 class="text-xl font-bold">
				<span class="text-emerald-400">K</span>-Stack Demo
			</h1>
			<span class="text-xs text-slate-500 hidden md:inline">
				Browser WebLLM vs Opus API
			</span>
		</div>

		<div class="flex items-center gap-4">
			{#if !revealed}
				<span class="text-sm text-slate-400">Blind mode: which is which?</span>
				<button
					onclick={reveal}
					class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
				>
					Reveal
				</button>
			{:else}
				<button
					onclick={reset}
					class="px-4 py-2 border border-white/20 hover:border-white/40 rounded-lg transition-colors"
				>
					Reset Demo
				</button>
			{/if}
		</div>
	</header>

	<!-- Model Status Bar -->
	{#if !aiState.ready}
		<div class="px-4 py-3 bg-slate-900 border-b border-white/10">
			{#if !aiState.available}
				<div class="flex items-center justify-between">
					<span class="text-amber-400">⚠️ WebGPU required for local inference</span>
					<span class="text-xs text-slate-500">Try Chrome or Edge on desktop</span>
				</div>
			{:else if aiState.loading}
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="text-emerald-400">Loading {LOCAL_MODELS[aiState.selectedModel].name}...</span>
						<span class="text-slate-400">{aiState.progress}%</span>
					</div>
					<div class="h-2 bg-slate-800 rounded-full overflow-hidden">
						<div
							class="h-full bg-emerald-500 transition-all duration-300"
							style="width: {aiState.progress}%"
						></div>
					</div>
					<p class="text-xs text-slate-500">{aiState.progressText}</p>
				</div>
			{:else}
				<div class="flex items-center justify-between">
					<div>
						<span class="text-slate-400">Local model: </span>
						<span class="text-emerald-400">{LOCAL_MODELS[aiState.selectedModel].name}</span>
						<span class="text-slate-500 text-sm ml-2">({LOCAL_MODELS[aiState.selectedModel].size})</span>
					</div>
					<button
						onclick={loadLocalModel}
						class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-colors"
					>
						Load Model
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<div class="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
			<div class="flex items-center gap-2 text-sm">
				<span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
				<span class="text-emerald-400">Local model running in your browser</span>
				<span class="text-slate-500">— {LOCAL_MODELS[aiState.selectedModel].name}</span>
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<div class="flex-1 flex flex-col overflow-hidden">
		<!-- Chat panels -->
		<div class="flex-1 flex overflow-hidden">
			<!-- Side A -->
			<div class="w-1/2 flex flex-col border-r border-white/10">
				<div class="p-3 border-b border-white/10 text-center">
					{#if revealed}
						<span class="font-bold {localIsA ? 'text-emerald-400' : 'text-rose-400'}">
							{localIsA ? '🖥️ BROWSER (WebLLM)' : '☁️ OPUS API'}
						</span>
					{:else}
						<span class="text-slate-400 font-medium">Model A</span>
					{/if}
				</div>
				<div bind:this={containerA} class="flex-1 overflow-y-auto p-4 space-y-3">
					{#each messagesA as msg}
						<div class="{msg.role === 'user' ? 'text-right' : 'text-left'}">
							<div class="inline-block max-w-[85%] px-4 py-2 rounded-2xl {msg.role === 'user' ? 'bg-slate-700' : 'bg-slate-800'}">
								<p class="text-sm whitespace-pre-wrap">{msg.content}</p>
							</div>
						</div>
					{/each}
					{#if messagesA.length === 0}
						<div class="flex items-center justify-center h-full text-slate-500">
							<p>Waiting for input...</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Side B -->
			<div class="w-1/2 flex flex-col">
				<div class="p-3 border-b border-white/10 text-center">
					{#if revealed}
						<span class="font-bold {!localIsA ? 'text-emerald-400' : 'text-rose-400'}">
							{!localIsA ? '🖥️ BROWSER (WebLLM)' : '☁️ OPUS API'}
						</span>
					{:else}
						<span class="text-slate-400 font-medium">Model B</span>
					{/if}
				</div>
				<div bind:this={containerB} class="flex-1 overflow-y-auto p-4 space-y-3">
					{#each messagesB as msg}
						<div class="{msg.role === 'user' ? 'text-right' : 'text-left'}">
							<div class="inline-block max-w-[85%] px-4 py-2 rounded-2xl {msg.role === 'user' ? 'bg-slate-700' : 'bg-slate-800'}">
								<p class="text-sm whitespace-pre-wrap">{msg.content}</p>
							</div>
						</div>
					{/each}
					{#if messagesB.length === 0}
						<div class="flex items-center justify-center h-full text-slate-500">
							<p>Waiting for input...</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Input bar -->
		<div class="p-4 border-t border-white/10 shrink-0">
			<div class="flex gap-3 max-w-4xl mx-auto">
				<textarea
					bind:value={input}
					onkeydown={handleKeydown}
					placeholder="Type a message... (sent to both models)"
					rows="2"
					disabled={!aiState.ready}
					class="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500 disabled:opacity-50"
				></textarea>
				<button
					onclick={sendMessage}
					disabled={loading || !input.trim() || !aiState.ready}
					class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-medium rounded-xl transition-colors"
				>
					{loading ? '...' : 'Send'}
				</button>
			</div>
		</div>

		<!-- Giant Stats Display -->
		<div class="border-t-2 border-white/20 bg-[#050508] shrink-0">
			<div class="flex">
				<!-- Stats A -->
				<div class="w-1/2 p-6 border-r border-white/10 text-center">
					{#if revealed}
						<p class="text-xs text-slate-500 mb-2 uppercase tracking-wider">
							{localIsA ? '🖥️ Browser' : '☁️ Opus API'}
						</p>
					{/if}
					<div class="space-y-2">
						<p class="text-5xl md:text-6xl font-bold {statsA.cost === 0 ? 'text-emerald-400' : 'text-rose-400'}">
							${formatCost(statsA.cost)}
						</p>
						<p class="text-2xl md:text-3xl font-mono {statsA.tokens === 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}">
							{formatTokens(statsA.tokens)} <span class="text-lg">tokens</span>
						</p>
						<p class="text-sm text-slate-500">
							{statsA.latency > 0 ? Math.round(statsA.latency) + 'ms' : '—'} · {statsA.queries} queries
						</p>
					</div>
				</div>

				<!-- Stats B -->
				<div class="w-1/2 p-6 text-center">
					{#if revealed}
						<p class="text-xs text-slate-500 mb-2 uppercase tracking-wider">
							{!localIsA ? '🖥️ Browser' : '☁️ Opus API'}
						</p>
					{/if}
					<div class="space-y-2">
						<p class="text-5xl md:text-6xl font-bold {statsB.cost === 0 ? 'text-emerald-400' : 'text-rose-400'}">
							${formatCost(statsB.cost)}
						</p>
						<p class="text-2xl md:text-3xl font-mono {statsB.tokens === 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}">
							{formatTokens(statsB.tokens)} <span class="text-lg">tokens</span>
						</p>
						<p class="text-sm text-slate-500">
							{statsB.latency > 0 ? Math.round(statsB.latency) + 'ms' : '—'} · {statsB.queries} queries
						</p>
					</div>
				</div>
			</div>

			<!-- Total comparison (after reveal) -->
			{#if revealed && (statsA.queries > 0 || statsB.queries > 0)}
				<div class="border-t border-white/10 p-4 text-center">
					<p class="text-sm text-slate-400">
						Same conversation.
						<span class="text-emerald-400 font-bold">Browser: $0.00</span> vs
						<span class="text-rose-400 font-bold">Opus: ${formatCost(localIsA ? statsB.cost : statsA.cost)}</span>
						<span class="text-slate-500 ml-2">
							({formatTokens(localIsA ? statsB.tokens : statsA.tokens)} tokens burned)
						</span>
					</p>
					<p class="text-xs text-slate-600 mt-1">
						Local model ran entirely in your browser. Zero data sent. Zero cost.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- API Key Modal -->
{#if showKeyModal}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
		<div class="bg-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 border border-white/10">
			<h2 class="text-xl font-semibold">Anthropic API Key Required</h2>
			<p class="text-sm text-slate-400">
				To run the Opus comparison, you need an Anthropic API key.
				Get one at <a href="https://console.anthropic.com/" target="_blank" class="text-emerald-400 underline">console.anthropic.com</a>
			</p>

			<input
				type="password"
				bind:value={tempKey}
				placeholder="sk-ant-..."
				class="w-full bg-slate-900 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
				onkeydown={(e) => e.key === 'Enter' && saveApiKey()}
			/>

			<div class="flex gap-2">
				<button
					onclick={() => showKeyModal = false}
					class="flex-1 py-2 rounded-lg border border-white/20 text-slate-400 hover:border-white/40 transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={saveApiKey}
					disabled={!tempKey.trim()}
					class="flex-1 py-2 rounded-lg bg-emerald-500 text-black font-medium disabled:opacity-50 transition-colors"
				>
					Save Key
				</button>
			</div>

			<p class="text-xs text-slate-500 text-center">
				Key is stored locally in your browser.
			</p>
		</div>
	</div>
{/if}
