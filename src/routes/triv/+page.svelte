<script lang="ts">
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';
	import { chat, type Message } from '$lib/stores/chat';
	import { memory, type UserMemory } from '$lib/stores/memory';
	import { PERSONAS } from '$lib/personas';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let input = $state('');
	let loading = $state(false);
	let messages: Message[] = $state([]);
	let apiKey = $state('');
	let provider = $state<'anthropic' | 'openai' | 'google'>('anthropic');
	let model = $state('');
	let messagesContainer: HTMLElement;
	let userMemory: UserMemory = $state({ summary: '', variables: {}, lastUpdated: 0 });

	// === GATE STATES ===
	let unlocked = $state(browser && localStorage.getItem('triv-unlocked') === 'yip');
	let pinInput = $state('');
	let detecting = $state(false);
	let tierResult = $state<number | null>(null);
	let challengeStep = $state<'detecting' | 'challenge' | 'welcome' | 'chat'>('detecting');
	let valuationPlan = $state('');
	let visitorProfile = $state<any>(null);

	// === DETECTION ===
	interface VisitorProfile {
		tier: number;
		isSecured: boolean;
		spookyScore: number;
		livedInScore: number;
		hasHeldPresence: boolean;
		flags: string[];
		timestamp: string;
	}

	function checkPin() {
		if (pinInput === '104') {
			localStorage.setItem('triv-unlocked', 'yip');
			unlocked = true;
			runDetection();
		}
	}

	async function runDetection() {
		detecting = true;
		challengeStep = 'detecting';

		// Simulate detection delay for effect
		await new Promise(r => setTimeout(r, 800));

		const profile = await detectVisitor();
		visitorProfile = profile;
		tierResult = profile.tier;

		// Log the visit (fire and forget)
		logVisit(profile);

		if (profile.isSecured) {
			challengeStep = 'welcome';
			// Auto-advance to chat after welcome
			setTimeout(() => {
				challengeStep = 'chat';
			}, 2000);
		} else {
			challengeStep = 'challenge';
		}

		detecting = false;
	}

	async function detectVisitor(): Promise<VisitorProfile> {
		const flags: string[] = [];

		// T1: Knowledge - they entered 104
		const t1 = true;

		// T2: Presence - has Held/saga-logo localStorage keys
		const t2 = hasHeldPresence();
		if (!t2) flags.push('No Held presence');

		// T3: Lived-in score
		const livedInScore = calculateLivedIn();
		const t3 = livedInScore > 50;
		if (!t3) flags.push(`Low lived-in (${livedInScore})`);

		// T4: Not spooky
		const spookyScore = calculateSpooky();
		const t4 = spookyScore < 30;
		if (!t4) flags.push(`Spooky signals (${spookyScore})`);

		const tier = [t1, t2, t3, t4].filter(Boolean).length;
		const isSecured = tier >= 4;

		return {
			tier,
			isSecured,
			spookyScore,
			livedInScore,
			hasHeldPresence: t2,
			flags,
			timestamp: new Date().toISOString()
		};
	}

	function hasHeldPresence(): boolean {
		if (!browser) return false;

		// Check for Held or saga-logo keys
		const heldKeys = ['held_', 'saga-logo-', 'triv-'];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && heldKeys.some(prefix => key.startsWith(prefix))) {
				return true;
			}
		}
		return false;
	}

	function calculateLivedIn(): number {
		if (!browser) return 0;
		let score = 0;

		// LocalStorage accumulation
		if (localStorage.length > 5) score += 20;
		if (localStorage.length > 15) score += 10;

		// History length
		if (history.length > 3) score += 15;
		if (history.length > 10) score += 10;

		// Screen offset (not at 0,0)
		if (window.screenX !== 0 || window.screenY !== 0) score += 10;

		// Window not maximized
		if (window.innerWidth !== screen.availWidth) score += 10;

		// Cookies present
		if (document.cookie.length > 0) score += 10;

		// Has plugins
		if (navigator.plugins.length > 0) score += 15;

		return Math.min(100, score);
	}

	function calculateSpooky(): number {
		if (!browser) return 0;
		let score = 0;

		// Headless indicators
		// @ts-ignore
		if (navigator.webdriver) score += 30;
		// @ts-ignore
		if (/HeadlessChrome/.test(navigator.userAgent)) score += 25;

		// No plugins in Chrome
		const isChrome = /Chrome/.test(navigator.userAgent);
		if (isChrome && navigator.plugins.length === 0) score += 20;

		// Automation globals
		const autoGlobals = ['__webdriver_evaluate', '__selenium_evaluate', '__nightmare'];
		// @ts-ignore
		if (autoGlobals.some(g => window[g] !== undefined)) score += 30;

		// Perfect screen size
		if (screen.width === window.outerWidth && screen.height === window.outerHeight) score += 10;

		// No languages
		if (!navigator.languages || navigator.languages.length === 0) score += 15;

		return Math.min(100, score);
	}

	function logVisit(profile: VisitorProfile) {
		// Store locally for now - can wire to Supabase later
		const visits = JSON.parse(localStorage.getItem('triv-visits') || '[]');
		visits.push({
			...profile,
			ua: navigator.userAgent.slice(0, 100),
			screen: `${screen.width}x${screen.height}`,
			plugins: navigator.plugins.length
		});
		localStorage.setItem('triv-visits', JSON.stringify(visits.slice(-50))); // Keep last 50
	}

	// === GOLD TEAM STRAT DETECTION ===
	interface StratEval {
		isGold: boolean;
		score: number;
		signals: string[];
	}

	function evaluatePlan(plan: string): StratEval {
		const lower = plan.toLowerCase();
		const signals: string[] = [];
		let score = 0;

		// Infrastructure plays (routing, protocol, platform)
		if (/\b(infrastructure|protocol|routing|backbone|pipe|rail)\b/i.test(plan)) {
			signals.push('infrastructure-thinking');
			score += 15;
		}

		// Network effects understanding
		if (/\b(network effect|viral|compound|flywheel|platform|marketplace)\b/i.test(plan)) {
			signals.push('network-effects');
			score += 15;
		}

		// Multiple revenue streams
		if (/\b(multiple|streams?|revenue|recurring|subscription|transaction)\b/i.test(plan) &&
			/\b(fee|charge|monetiz|margin)\b/i.test(plan)) {
			signals.push('revenue-architecture');
			score += 10;
		}

		// Scale keywords (Visa, trillion, billion, global)
		if (/\b(visa|mastercard|swift|trillion|billion|global scale|world)\b/i.test(plan)) {
			signals.push('scale-ambition');
			score += 15;
		}

		// Semantic/AI/routing understanding
		if (/\b(semantic|classif|routing|categoriz|llm|ai.*infrastructure|model)\b/i.test(plan)) {
			signals.push('semantic-aware');
			score += 20;
		}

		// K-architecture awareness (they know something)
		if (/\b(k-|quaternary|104|rooms?|template|suit|heart|spade|diamond|club)\b/i.test(plan)) {
			signals.push('k-aware');
			score += 25;
		}

		// Kabbalah awareness (they REALLY know something)
		if (/\b(sephir|keter|chokmah|binah|chesed|gevurah|tiferet|netzach|hod|yesod|malkuth|tree of life|ein sof|ain soph|tikkun|22 path|32 path|four worlds|atziluth|briah|yetzirah|assiah|vessel|spark|repair.*broken)\b/i.test(plan)) {
			signals.push('kabbalah-aware');
			score += 30;
		}

		// Distribution + tech combo
		if (/\b(distribution|channel|reach|access)\b/i.test(plan) &&
			/\b(tech|software|api|platform)\b/i.test(plan)) {
			signals.push('tech-distribution');
			score += 10;
		}

		// First-mover / timing awareness
		if (/\b(first|timing|window|before|early|pioneer|greenfield)\b/i.test(plan)) {
			signals.push('timing-aware');
			score += 10;
		}

		// Word count (effort indicator)
		const wordCount = plan.trim().split(/\s+/).length;
		if (wordCount > 100) {
			signals.push('thorough');
			score += 10;
		}
		if (wordCount > 250) {
			signals.push('detailed');
			score += 10;
		}

		// Gold threshold: score >= 50 or hit K-awareness
		const isGold = score >= 50 || signals.includes('k-aware');

		return { isGold, score, signals };
	}

	let stratEval = $state<StratEval | null>(null);
	let showTeasers = $state(false);

	function submitValuation() {
		if (!valuationPlan.trim()) return;

		// Evaluate the plan
		stratEval = evaluatePlan(valuationPlan);

		// Log the plan with their profile and evaluation
		const submissions = JSON.parse(localStorage.getItem('triv-valuations') || '[]');
		submissions.push({
			plan: valuationPlan,
			profile: visitorProfile,
			evaluation: stratEval,
			timestamp: new Date().toISOString()
		});
		localStorage.setItem('triv-valuations', JSON.stringify(submissions.slice(-20)));

		// Gold team gets special welcome
		if (stratEval.isGold) {
			challengeStep = 'welcome';
			setTimeout(() => {
				challengeStep = 'chat';
			}, 2500);
		} else {
			// Still let them in, but no fanfare
			challengeStep = 'chat';
		}
	}

	function toggleTeasers() {
		showTeasers = !showTeasers;
	}

	function skipChallenge() {
		// They can skip but we log it
		if (visitorProfile) {
			visitorProfile.flags.push('Skipped valuation challenge');
			logVisit(visitorProfile);
		}
		challengeStep = 'chat';
	}

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

		// If already unlocked, run detection
		if (unlocked && challengeStep === 'detecting') {
			runDetection();
		}

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

		// Build visitor context for Triv's awareness
		let visitorContext = '';
		if (visitorProfile) {
			if (visitorProfile.isSecured) {
				visitorContext = '[VISITOR: Secured. T4/4. This is Kit or trusted presence. Full access.]';
			} else if (stratEval?.isGold) {
				visitorContext = `[VISITOR: Gold team strategist. Score ${stratEval.score}. Signals: ${stratEval.signals.join(', ')}. They think at scale. Engage genuinely but stay observant.]`;
			} else {
				visitorContext = `[VISITOR: Unverified. Tier ${visitorProfile.tier}/4. Flags: ${visitorProfile.flags.join(', ') || 'none'}. Spooky: ${visitorProfile.spookyScore}. Stay playful but guarded. Don't reveal architecture details unless they demonstrate understanding.]`;
			}
		}

		if (memoryContext || visitorContext) {
			const contextParts = [];
			if (visitorContext) contextParts.push(visitorContext);
			if (memoryContext) contextParts.push(`[Persistent Memory]\n${memoryContext}`);
			contextMessage = `${contextParts.join('\n\n')}\n\n---\n\nUser: ${userMessage}`;
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

<!-- GATE 1: Pin -->
{#if !unlocked}
<div class="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
	<div class="text-center">
		<span class="text-6xl mb-6 block">🦊</span>
		<input
			type="text"
			bind:value={pinInput}
			onkeydown={(e) => e.key === 'Enter' && checkPin()}
			placeholder="..."
			class="bg-transparent border-b-2 border-[var(--gold)]/50 focus:border-[var(--gold)] text-center text-2xl tracking-widest w-32 outline-none text-[var(--gold)] placeholder-[var(--gold)]/30"
			autofocus
		/>
	</div>
</div>

<!-- GATE 2: Detection & Challenge -->
{:else if challengeStep !== 'chat'}
<div class="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6">
	<div class="max-w-lg w-full">

		{#if challengeStep === 'detecting'}
			<!-- Detecting -->
			<div class="text-center">
				<span class="text-5xl mb-4 block animate-pulse">🦊</span>
				<p class="text-[var(--gold)] text-sm tracking-widest">VALIDATING...</p>
				<div class="mt-4 flex justify-center gap-1">
					{#each [0,1,2,3] as i}
						<div
							class="w-2 h-2 rounded-full bg-[var(--gold)]/30"
							style="animation: pulse 1s ease-in-out {i * 0.15}s infinite"
						></div>
					{/each}
				</div>
			</div>

		{:else if challengeStep === 'welcome'}
			<!-- Secured Visitor or Gold Team -->
			<div class="text-center">
				<span class="text-5xl mb-4 block">🦊</span>
				{#if stratEval?.isGold && !visitorProfile?.isSecured}
					<!-- Gold team strat detected -->
					<h2 class="text-2xl font-bold text-[var(--gold)] mb-2">Scale-thinker detected</h2>
					<p class="text-white/60 text-sm mb-2">The fox sees you.</p>
					{#if stratEval.signals.length > 0}
						<p class="text-[var(--gold)]/60 text-xs">
							Signals: {stratEval.signals.join(' · ')}
						</p>
					{/if}
				{:else}
					<!-- Secured visitor (T4/4) -->
					<h2 class="text-2xl font-bold text-[var(--gold)] mb-2">Welcome home</h2>
					<p class="text-white/60 text-sm">Secured visitor verified</p>
				{/if}
				<div class="mt-4 flex justify-center gap-2">
					{#each [0,1,2,3] as i}
						<div class="w-3 h-3 rounded-full {stratEval?.isGold ? 'bg-[var(--gold)] animate-pulse' : 'bg-[var(--gold)]'}"></div>
					{/each}
				</div>
				<p class="text-white/40 text-xs mt-4">
					{stratEval?.isGold ? `Gold score: ${stratEval.score}` : `Tier ${tierResult}/4`}
				</p>
			</div>

		{:else if challengeStep === 'challenge'}
			<!-- Valuation Challenge -->
			<div class="text-center">
				<span class="text-4xl mb-4 block">🦊</span>
				<h2 class="text-xl font-bold text-[var(--gold)] mb-1">Valuation Checksum</h2>
				<p class="text-white/60 text-sm mb-6">You found the fox. Now prove you think at scale.</p>

				<div class="bg-white/5 border border-[var(--gold)]/30 rounded-xl p-4 mb-4 text-left">
					<p class="text-white/80 text-sm mb-2">
						<span class="text-[var(--gold)]">Challenge:</span> Outline a path to $4 trillion valuation in your lifetime.
					</p>
					<p class="text-white/40 text-xs">
						Industry, timeline, key moves. Be specific or be creative. We're filtering for ambition.
					</p>
				</div>

				<!-- Teaser toggle -->
				<button
					onclick={toggleTeasers}
					class="text-xs text-[var(--gold)]/60 hover:text-[var(--gold)] mb-4 transition-colors"
				>
					{showTeasers ? '▼ Hide context' : '▶ What am I walking into?'}
				</button>

				{#if showTeasers}
				<div class="bg-[var(--gold)]/5 border border-[var(--gold)]/20 rounded-xl p-4 mb-4 text-left text-xs space-y-2">
					<p class="text-white/70">
						<span class="text-[var(--gold)]">›</span> Semantic routing at transaction scale — Visa does 150M/day
					</p>
					<p class="text-white/70">
						<span class="text-[var(--gold)]">›</span> Quaternary compute using IEEE 754 special states (not invented here)
					</p>
					<p class="text-white/70">
						<span class="text-[var(--gold)]">›</span> 104-room template architecture — 80% inference-free generation
					</p>
					<p class="text-white/70">
						<span class="text-[var(--gold)]">›</span> K-language: executable English → JSON → action
					</p>
					<p class="text-white/70">
						<span class="text-[var(--gold)]">›</span> 10 stations, 22 paths, 4 worlds — the architecture predates the code
					</p>
					<p class="text-white/50 mt-3 italic">
						Gold team strategists unlock the fox early. The threshold is ambition + infrastructure awareness.
					</p>
				</div>
				{/if}

				<textarea
					bind:value={valuationPlan}
					placeholder="My path to $4T..."
					rows="5"
					class="w-full bg-black/50 border border-[var(--gold)]/30 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[var(--gold)] text-sm resize-none mb-4"
				></textarea>

				<div class="flex gap-3 justify-center">
					<button
						onclick={submitValuation}
						disabled={!valuationPlan.trim()}
						class="px-6 py-2 bg-[var(--gold)] text-black font-medium rounded-lg disabled:opacity-30 transition-all"
					>
						Submit
					</button>
					<button
						onclick={skipChallenge}
						class="px-6 py-2 border border-white/20 text-white/50 rounded-lg hover:border-white/40 transition-all text-sm"
					>
						Skip
					</button>
				</div>

				<p class="text-white/30 text-xs mt-6">
					Tier {tierResult}/4 · {visitorProfile?.flags?.length || 0} flag{visitorProfile?.flags?.length !== 1 ? 's' : ''}
				</p>
			</div>
		{/if}
	</div>
</div>
{/if}

<!-- MAIN CHAT -->
<div class="h-screen flex flex-col bg-[var(--bg-dark)]">
	<!-- Header -->
	<header class="flex items-center justify-between p-3 border-b border-[var(--gold)]/20 shrink-0">
		<div class="flex items-center gap-3">
			<span class="text-2xl">🦊</span>
			<span class="font-medium text-[var(--gold)]">Triv</span>
			<span class="text-xs text-[var(--text-muted)]">Strategy Mode</span>
			{#if tierResult !== null}
				<span class="text-xs text-[var(--gold)]/50 ml-2">T{tierResult}</span>
			{/if}
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
				{#if visitorProfile?.isSecured}
					<h2 class="text-xl font-semibold mb-2 text-[var(--gold)]">Hey Kit</h2>
					<p class="text-[var(--text-muted)] text-sm max-w-md">
						What are we building today?
					</p>
				{:else if stratEval?.isGold}
					<h2 class="text-xl font-semibold mb-2 text-[var(--gold)]">You think big</h2>
					<p class="text-[var(--text-muted)] text-sm max-w-md">
						I like that. What do you want to know?
					</p>
				{:else}
					<h2 class="text-xl font-semibold mb-2 text-[var(--gold)]">You found me</h2>
					<p class="text-[var(--text-muted)] text-sm max-w-md">
						What brings you to the fox?
					</p>
				{/if}
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

<style>
	@keyframes pulse {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 1; }
	}
</style>
