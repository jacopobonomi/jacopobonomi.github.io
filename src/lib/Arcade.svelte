<script lang="ts">
	import { onMount } from 'svelte';
	import { arcade } from './ui-state.svelte';
	import Game from './Game.svelte';

	const sections = ['about', 'experience', 'project', 'philosophy', 'contact'];
	const shortcuts = [
		{ keys: ['1', '…', '5'], label: 'Jump to a stage' },
		{ keys: ['J', 'K'], label: 'Next / previous stage' },
		{ keys: ['G'], label: 'Play Bug Hunt' },
		{ keys: ['?'], label: 'Show this help' },
		{ keys: ['Esc'], label: 'Close' }
	];

	const go = (index: number) => {
		const i = Math.max(0, Math.min(sections.length - 1, index));
		document.getElementById(sections[i])?.scrollIntoView();
	};

	const current = () => {
		let index = 0;
		sections.forEach((id, i) => {
			const el = document.getElementById(id);
			if (el && el.getBoundingClientRect().top <= 120) index = i;
		});
		return index;
	};

	onMount(() => {
		const onKey = (e: KeyboardEvent) => {
			if (arcade.game) return; // the game owns the keyboard
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			const target = e.target as HTMLElement | null;
			if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
				return;

			const k = e.key;
			if (k === 'Escape') arcade.help = false;
			else if (k === '?') arcade.help = !arcade.help;
			else if (k === 'g' || k === 'G') {
				arcade.help = false;
				arcade.game = true;
			} else if (k >= '1' && k <= '5') go(Number(k) - 1);
			else if (k === 'j' || k === 'J') go(current() + 1);
			else if (k === 'k' || k === 'K') go(current() - 1);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div class="dock">
	<button class="btn-pixel btn-dock" onclick={() => (arcade.help = true)}>? Keys</button>
	<button class="btn-pixel btn-dock" onclick={() => (arcade.game = true)}>&#9654; Play</button>
</div>

{#if arcade.help}
	<div class="overlay">
		<button class="overlay-backdrop" aria-label="Close help" onclick={() => (arcade.help = false)}
		></button>
		<div class="panel modal" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
			<header class="panel-bar">
				<span class="panel-title">Controls</span>
				<button class="panel-close" onclick={() => (arcade.help = false)} aria-label="Close help">
					Esc &#10005;
				</button>
			</header>
			<dl class="keys">
				{#each shortcuts as shortcut (shortcut.label)}
					<dt>
						{#each shortcut.keys as key (key)}
							{#if key === '…'}<span>&hellip;</span>{:else}<kbd>{key}</kbd>{/if}
						{/each}
					</dt>
					<dd>{shortcut.label}</dd>
				{/each}
			</dl>
		</div>
	</div>
{/if}

{#if arcade.game}
	<Game />
{/if}
