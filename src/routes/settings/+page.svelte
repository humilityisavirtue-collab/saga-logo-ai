<script lang="ts">
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';

	let apiKey = $state('');
	let provider = $state<'anthropic' | 'openai' | 'google'>('anthropic');
	let model = $state('claude-sonnet-4-20250514');
	let saved = $state(false);

	$effect(() => {
		const unsub = settings.subscribe((s) => {
			apiKey = s.apiKey;
			provider = s.apiProvider;
			model = s.model;
		});
		return unsub;
	});

	function save() {
		settings.setApiKey(apiKey);
		settings.setProvider(provider);
		settings.setModel(model);
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

		<!-- BYOK Section -->
		<div class="bg-[var(--bg-card)] rounded-2xl p-6 space-y-6">
			<div>
				<h2 class="text-lg font-semibold mb-2">Bring Your Own Key</h2>
				<p class="text-sm text-[var(--text-muted)] mb-4">
					Your API key is stored locally in your browser. We never see or store it.
				</p>
			</div>

			<!-- Provider -->
			<div>
				<label class="block text-sm font-medium mb-2">Provider</label>
				<div class="flex gap-2">
					<button
						onclick={() => {
							provider = 'anthropic';
							model = models.anthropic[0].id;
						}}
						class="flex-1 py-2 rounded-lg border transition-colors {provider === 'anthropic'
							? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]'
							: 'border-white/10 text-[var(--text-muted)]'}"
					>
						Anthropic
					</button>
					<button
						onclick={() => {
							provider = 'openai';
							model = models.openai[0].id;
						}}
						class="flex-1 py-2 rounded-lg border transition-colors {provider === 'openai'
							? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]'
							: 'border-white/10 text-[var(--text-muted)]'}"
					>
						OpenAI
					</button>
					<button
						onclick={() => {
							provider = 'google';
							model = models.google[0].id;
						}}
						class="flex-1 py-2 rounded-lg border transition-colors {provider === 'google'
							? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]'
							: 'border-white/10 text-[var(--text-muted)]'}"
					>
						Google
					</button>
				</div>
			</div>

			<!-- API Key -->
			<div>
				<label for="apiKey" class="block text-sm font-medium mb-2">API Key</label>
				<input
					id="apiKey"
					type="password"
					bind:value={apiKey}
					placeholder={provider === 'anthropic' ? 'sk-ant-...' : provider === 'openai' ? 'sk-...' : 'AIza...'}
					class="w-full bg-[var(--bg-dark)] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
				/>
				<p class="text-xs text-[var(--text-muted)] mt-2">
					{#if provider === 'anthropic'}
						Get your key at <a href="https://console.anthropic.com" target="_blank" class="text-[var(--gold)] underline">console.anthropic.com</a>
					{:else if provider === 'openai'}
						Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" class="text-[var(--gold)] underline">platform.openai.com</a>
					{:else}
						Get your free key at <a href="https://aistudio.google.com/apikey" target="_blank" class="text-[var(--gold)] underline">aistudio.google.com</a>
					{/if}
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
				{saved ? '✓ Saved' : 'Save Settings'}
			</button>
		</div>

		<!-- Info -->
		<div class="mt-6 text-center text-sm text-[var(--text-muted)]">
			<p>Your data stays on your device.</p>
			<p class="mt-1">We don't store your API key or conversations.</p>
		</div>
	</div>
</div>
