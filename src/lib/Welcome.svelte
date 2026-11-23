<script lang="ts">
	import Window from './Window.svelte';
	import { arcade } from './ui-state.svelte';

	// one level per year since the first job (2015)
	const level = new Date().getFullYear() - 2015;

	const links = [
		{
			label: 'linkedin',
			icon: 'fa-linkedin-in',
			href: 'https://www.linkedin.com/in/jacopo-bonomi/'
		},
		{ label: 'github', icon: 'fa-github', href: 'https://github.com/jacopobonomi' },
		{
			label: 'stackoverflow',
			icon: 'fa-stack-overflow',
			href: 'https://stackoverflow.com/users/8664379/jacopo-bonomi'
		}
	];
</script>

<Window id="about" title="Stage 1 · Player select" path="~/whoami">
	<div class="animate__animated animate__fadeIn">
		<div class="hud">
			<span>1UP <b>JACOPO</b></span>
			<span class="hud-hearts" aria-hidden="true">&#9829;&#9829;&#9829;</span>
			<span>LV <b>{level}</b></span>
			<span>CLASS <b>TECH LEAD</b></span>
		</div>

		<h1 class="pixel mt-10 text-3xl leading-snug uppercase md:text-5xl md:leading-snug">
			Hi &#9996;<br /> I'm Jacopo
		</h1>
		<p class="mt-6 text-2xl font-bold">
			computer science enthusiast and critical thinker<span class="cursor"></span>
		</p>
		<p class="mt-4 max-w-2xl text-xl text-slate-300">
			I'm a software engineer, I love to write code and I'm always looking for new ways to improve
			my skills.
		</p>

		<p class="label mt-12">Follow me</p>
		<div class="mt-4 flex flex-wrap gap-4">
			{#each links as link (link.href)}
				<a href={link.href} class="btn-pixel">
					<i class="fab {link.icon}"></i>
					<span>{link.label}</span>
				</a>
			{/each}
		</div>

		<div class="mt-16 flex flex-wrap items-center gap-x-10 gap-y-4">
			<a href="#experience" class="press-start">&#9660; Press start</a>
			<button class="insert-coin" onclick={() => (arcade.game = true)}>
				Insert coin: play Bug Hunt <kbd>G</kbd>
			</button>
		</div>
	</div>
</Window>
