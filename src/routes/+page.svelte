<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="min-h-screen flex flex-col">
	<!-- Hero -->
	<main class="flex-1 flex flex-col items-center justify-center px-4 text-center">
		<div class="max-w-3xl">
			<!-- Logo/Title -->
			<h1 class="text-5xl md:text-7xl font-bold mb-4">
				<span class="text-[var(--saga-primary)]">Saga</span>.<span class="text-[var(--logo-primary)]">Logo</span>.<span class="text-[var(--gold)]">AI</span>
			</h1>
			<p class="text-xl text-[var(--text-muted)] mb-2 tracking-wide">Konnected</p>

			<p class="text-lg md:text-xl text-[var(--text-muted)] mb-8 max-w-xl mx-auto">
				Dual-persona AI writing coach.<br/>
				<span class="text-[var(--saga-secondary)]">Creative flow</span> meets <span class="text-[var(--logo-secondary)]">editorial precision</span>.
			</p>

			<!-- Persona cards -->
			<div class="grid md:grid-cols-2 gap-6 mb-12">
				<!-- Saga -->
				<div class="bg-[var(--saga-bg)]/50 border border-[var(--saga-primary)]/30 rounded-2xl p-6 text-left">
					<div class="text-3xl mb-2">🌊</div>
					<h3 class="text-xl font-semibold text-[var(--saga-primary)] mb-2">Saga</h3>
					<p class="text-[var(--text-muted)] text-sm">
						The River. Creative mode. Warm, unhurried, generative.
						Asks more than tells. Lets ideas flow without judgment.
					</p>
				</div>

				<!-- Logo -->
				<div class="bg-[var(--logo-bg)]/50 border border-[var(--logo-primary)]/30 rounded-2xl p-6 text-left">
					<div class="text-3xl mb-2">⚡</div>
					<h3 class="text-xl font-semibold text-[var(--logo-primary)] mb-2">Logo</h3>
					<p class="text-[var(--text-muted)] text-sm">
						The Compiler. Precision mode. Formal, sardonic, exacting.
						Demands clarity. Rejects entropy. Edits without mercy.
					</p>
				</div>
			</div>

			<!-- CTA -->
			<div class="space-y-4">
				<button
					onclick={() => goto('/write')}
					class="px-8 py-3 bg-[var(--gold)] hover:bg-yellow-400 text-[var(--bg-dark)] font-semibold rounded-xl transition-colors text-lg"
				>
					Start Writing
				</button>
				<p class="text-sm text-[var(--text-muted)]">
					Bring your own API key. Your words, your data.
				</p>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="py-6 text-center text-sm text-[var(--text-muted)] space-y-2">
		<p>Built with K — the language of intent</p>
		<p>
			<a href="https://buymeacoffee.com/holdtheline" target="_blank" class="text-[var(--gold)] hover:underline">
				Support the project
			</a>
		</p>
	</footer>
</div>
