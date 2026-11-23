<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		title,
		path,
		children
	}: { id: string; title: string; path: string; children: Snippet } = $props();
</script>

<section {id} class="panel">
	<header class="panel-bar">
		<span class="panel-title">{title}</span>
		<span class="panel-path">{path}</span>
	</header>
	<div class="panel-body">
		{@render children()}
	</div>
</section>
