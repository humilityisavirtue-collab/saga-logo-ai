<script lang="ts">
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';
	import { onMount } from 'svelte';

	let provider = $state<'anthropic' | 'openai' | 'google'>('anthropic');
	let model = $state('claude-sonnet-4-20250514');
	let anthropicKey = $state('');
	let openaiKey = $state('');
	let googleKey = $state('');
	let saved = $state(false);
	let initialized = $state(false);

	// Currently active settings (from store)
	let activeProvider = $state<'anthropic' | 'openai' | 'google'>('anthropic');
	let activeModel = $state('');

	onMount(() => {
		const unsub = settings.subscribe((s) => {
			if (!initialized) {
				provider = s.apiProvider;
				model = s.model;
				anthropicKey = s.anthropicKey || s.apiKey || '';
				openaiKey = s.openaiKey || '';
				googleKey = s.googleKey || '';
				initialized = true;
			}
			// Always update active display
			activeProvider = s.apiProvider;
			activeModel = s.model;
		});
		return unsub;
	});

	function save() {
		// Get the key for the selected provider
		const keyForProvider = provider === 'anthropic' ? anthropicKey
			: provider === 'openai' ? openaiKey
			: googleKey;

		settings.update(s => ({
			...s,
			apiProvider: provider,
			model: model,
			apiKey: keyForProvider,
			anthropicKey,
			openaiKey,
			googleKey
		}));
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}

	const models = {
		anthropic: [
			{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
			{ id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
			{ id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' }
		],
		openai: [
			{ id: 'gpt-4o', name: 'GPT-4o' },
			{ id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
			{ id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
		],
		google: [
			{ id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Free)' },
			{ id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
			{ id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
		]
	};

	const providerNames = {
		anthropic: 'Anthropic',
		openai: 'OpenAI',
		google: 'Google'
	};

	function getModelName(modelId: string): string {
		for (const list of Object.values(models)) {
			const found = list.find(m => m.id === modelId);
			if (found) return found.name;
		}
		return modelId;
	}
</script>

<div class="min-h-screen p-4">
	<div class="max-w-xl mx-auto">
		<!-- Header -->
		<div class="flex items-center gap-4 mb-8">
			<button onclick={() => goto('/write')} class="text-[var(--text-muted)] hover:text-white">
				← Back
			</button>
			<h1 class="text-2xl font-bold">Settings</h1>
		</div>

		<!-- Active Config Banner -->
		<div class="bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-xl p-4 mb-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-[var(--gold)] uppercase tracking-wide mb-1">Currently Active</p>
					<p class="font-medium">{providerNames[activeProvider]} · {getModelName(activeModel)}</p>
				</div>
				<div class="text-2xl">
					{activeProvider === 'anthropic' ? '🔮' : activeProvider === 'openai' ? '🤖' : '✨'}
				</div>
			</div>
		</div>

		<!-- BYOK Section -->
		<div class="bg-[var(--bg-card)] rounded-2xl p-6 space-y-6">
			<div>
				<h2 class="text-lg font-semibold mb-2">Bring Your Own Key</h2>
				<p class="text-sm text-[var(--text-muted)]">
					Store keys for each provider. Switch anytime.
				</p>
			</div>

			<!-- Provider Selection -->
			<div>
				<label class="block text-sm font-medium mb-2">Select Provider</label>
				<div class="flex gap-2">
					<button
						onclick={() => {
							provider = 'anthropic';
							model = models.anthropic[0].id;
						}}
						class="flex-1 py-3 rounded-lg border-2 transition-all font-medium {provider === 'anthropic'
							? 'border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)]'
							: 'border-white/10 text-[var(--text-muted)] hover:border-white/30'}"
					>
						🔮 Anthropic
					</button>
					<button
						onclick={() => {
							provider = 'openai';
							model = models.openai[0].id;
						}}
						class="flex-1 py-3 rounded-lg border-2 transition-all font-medium {provider === 'openai'
							? 'border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)]'
							: 'border-white/10 text-[var(--text-muted)] hover:border-white/30'}"
					>
						🤖 OpenAI
					</button>
					<button
						onclick={() => {
							provider = 'google';
							model = models.google[0].id;
						}}
						class="flex-1 py-3 rounded-lg border-2 transition-all font-medium {provider === 'google'
							? 'border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)]'
							: 'border-white/10 text-[var(--text-muted)] hover:border-white/30'}"
					>
						✨ Google
					</button>
				</div>
			</div>

			<!-- API Keys - All Three -->
			<div class="space-y-4">
				<label class="block text-sm font-medium">API Keys</label>

				<!-- Anthropic -->
				<div class="relative">
					<div class="flex items-center gap-2 mb-1">
						<span class="text-sm {provider === 'anthropic' ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'}">
							🔮 Anthropic {anthropicKey ? '✓' : ''}
						</span>
						{#if provider === 'anthropic'}
							<span class="text-xs bg-[var(--gold)]/20 text-[var(--gold)] px-2 py-0.5 rounded">selected</span>
						{/if}
					</div>
					<input
						type="password"
						bind:value={anthropicKey}
						placeholder="sk-ant-..."
						class="w-full bg-[var(--bg-dark)] border rounded-lg px-4 py-2 focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm {provider === 'anthropic' ? 'border-[var(--gold)]/50 focus:border-[var(--gold)]' : 'border-white/10 focus:border-white/30'}"
					/>
				</div>

				<!-- OpenAI -->
				<div class="relative">
					<div class="flex items-center gap-2 mb-1">
						<span class="text-sm {provider === 'openai' ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'}">
							🤖 OpenAI {openaiKey ? '✓' : ''}
						</span>
						{#if provider === 'openai'}
							<span class="text-xs bg-[var(--gold)]/20 text-[var(--gold)] px-2 py-0.5 rounded">selected</span>
						{/if}
					</div>
					<input
						type="password"
						bind:value={openaiKey}
						placeholder="sk-..."
						class="w-full bg-[var(--bg-dark)] border rounded-lg px-4 py-2 focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm {provider === 'openai' ? 'border-[var(--gold)]/50 focus:border-[var(--gold)]' : 'border-white/10 focus:border-white/30'}"
					/>
				</div>

				<!-- Google -->
				<div class="relative">
					<div class="flex items-center gap-2 mb-1">
						<span class="text-sm {provider === 'google' ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'}">
							✨ Google {googleKey ? '✓' : ''} <span class="text-xs opacity-60">(free tier)</span>
						</span>
						{#if provider === 'google'}
							<span class="text-xs bg-[var(--gold)]/20 text-[var(--gold)] px-2 py-0.5 rounded">selected</span>
						{/if}
					</div>
					<input
						type="password"
						bind:value={googleKey}
						placeholder="AIza..."
						class="w-full bg-[var(--bg-dark)] border rounded-lg px-4 py-2 focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm {provider === 'google' ? 'border-[var(--gold)]/50 focus:border-[var(--gold)]' : 'border-white/10 focus:border-white/30'}"
					/>
				</div>

				<p class="text-xs text-[var(--text-muted)]">
					Get keys:
					<a href="https://console.anthropic.com" target="_blank" class="text-[var(--gold)] hover:underline">Anthropic</a> ·
					<a href="https://platform.openai.com/api-keys" target="_blank" class="text-[var(--gold)] hover:underline">OpenAI</a> ·
					<a href="https://aistudio.google.com/apikey" target="_blank" class="text-[var(--gold)] hover:underline">Google (free)</a>
				</p>
			</div>

			<!-- Model -->
			<div>
				<label for="model" class="block text-sm font-medium mb-2">Model</label>
				<select
					id="model"
					bind:value={model}
					class="w-full bg-[var(--bg-dark)] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)]"
				>
					{#each models[provider] as m}
						<option value={m.id}>{m.name}</option>
					{/each}
				</select>
			</div>

			<!-- Save -->
			<button
				onclick={save}
				class="w-full py-3 bg-[var(--gold)] hover:bg-yellow-400 text-[var(--bg-dark)] font-semibold rounded-xl transition-colors"
			>
				{saved ? '✓ Saved' : 'Save & Activate'}
			</button>
		</div>

		<!-- Info -->
		<div class="mt-6 text-center text-sm text-[var(--text-muted)]">
			<p>Your data stays on your device.</p>
			<p class="mt-1">We don't store your API keys or conversations.</p>
		</div>

		<!-- Support -->
		<div class="mt-6 text-center">
			<a
				href="https://buymeacoffee.com/holdtheline"
				target="_blank"
				class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-lg text-[var(--gold)] hover:bg-[var(--gold)]/20 transition-colors text-sm"
			>
				☕ Support Saga.Logo.AI
			</a>
		</div>
	</div>
</div>
