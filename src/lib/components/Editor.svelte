<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';

	let element: HTMLDivElement;
	let editor: Editor;

	// Expose editor content for external access
	export function getContent(): string {
		return editor?.getHTML() || '';
	}

	export function getText(): string {
		return editor?.getText() || '';
	}

	export function setContent(html: string) {
		editor?.commands.setContent(html);
	}

	export function insertText(text: string) {
		editor?.commands.insertContent(text);
	}

	export function appendText(text: string) {
		editor?.commands.focus('end');
		editor?.commands.insertContent(text);
	}

	export function clear() {
		editor?.commands.clearContent();
	}

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3]
					}
				}),
				Placeholder.configure({
					placeholder: 'Start writing your story here...'
				})
			],
			content: '',
			editorProps: {
				attributes: {
					class: 'prose prose-invert max-w-none focus:outline-none min-h-full p-4'
				}
			},
			onTransaction: () => {
				// Force reactivity
				editor = editor;
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	// Toolbar actions
	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	function toggleHeading(level: 1 | 2 | 3) {
		editor?.chain().focus().toggleHeading({ level }).run();
	}

	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	function toggleBlockquote() {
		editor?.chain().focus().toggleBlockquote().run();
	}

	function setHorizontalRule() {
		editor?.chain().focus().setHorizontalRule().run();
	}
</script>

<div class="flex flex-col h-full bg-[var(--bg-card)] rounded-xl border border-white/10 overflow-hidden">
	<!-- Toolbar -->
	<div class="flex items-center gap-1 p-2 border-b border-white/10 bg-[var(--bg-dark)]">
		<button
			onclick={toggleBold}
			class="p-2 rounded hover:bg-white/10 transition-colors {editor?.isActive('bold') ? 'bg-white/20' : ''}"
			title="Bold"
		>
			<span class="font-bold">B</span>
		</button>
		<button
			onclick={toggleItalic}
			class="p-2 rounded hover:bg-white/10 transition-colors {editor?.isActive('italic') ? 'bg-white/20' : ''}"
			title="Italic"
		>
			<span class="italic">I</span>
		</button>
		<div class="w-px h-6 bg-white/20 mx-1"></div>
		<button
			onclick={() => toggleHeading(1)}
			class="p-2 rounded hover:bg-white/10 transition-colors {editor?.isActive('heading', { level: 1 }) ? 'bg-white/20' : ''}"
			title="Heading 1"
		>
			H1
		</button>
		<button
			onclick={() => toggleHeading(2)}
			class="p-2 rounded hover:bg-white/10 transition-colors {editor?.isActive('heading', { level: 2 }) ? 'bg-white/20' : ''}"
			title="Heading 2"
		>
			H2
		</button>
		<button
			onclick={() => toggleHeading(3)}
			class="p-2 rounded hover:bg-white/10 transition-colors {editor?.isActive('heading', { level: 3 }) ? 'bg-white/20' : ''}"
			title="Heading 3"
		>
			H3
		</button>
		<div class="w-px h-6 bg-white/20 mx-1"></div>
		<button
			onclick={toggleBulletList}
			class="p-2 rounded hover:bg-white/10 transition-colors {editor?.isActive('bulletList') ? 'bg-white/20' : ''}"
			title="Bullet List"
		>
			•
		</button>
		<button
			onclick={toggleBlockquote}
			class="p-2 rounded hover:bg-white/10 transition-colors {editor?.isActive('blockquote') ? 'bg-white/20' : ''}"
			title="Quote"
		>
			"
		</button>
		<button
			onclick={setHorizontalRule}
			class="p-2 rounded hover:bg-white/10 transition-colors"
			title="Divider"
		>
			—
		</button>
	</div>

	<!-- Editor -->
	<div class="flex-1 overflow-y-auto">
		<div bind:this={element} class="h-full"></div>
	</div>
</div>

<style>
	:global(.ProseMirror) {
		min-height: 100%;
		padding: 1rem;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: var(--text-muted);
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	:global(.ProseMirror h1) {
		font-size: 1.875rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	:global(.ProseMirror h2) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	:global(.ProseMirror h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	:global(.ProseMirror p) {
		margin-bottom: 0.75rem;
	}

	:global(.ProseMirror blockquote) {
		border-left: 3px solid var(--text-muted);
		padding-left: 1rem;
		margin-left: 0;
		font-style: italic;
		color: var(--text-muted);
	}

	:global(.ProseMirror ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin-bottom: 0.75rem;
	}

	:global(.ProseMirror hr) {
		border: none;
		border-top: 1px solid var(--text-muted);
		margin: 1.5rem 0;
	}
</style>
