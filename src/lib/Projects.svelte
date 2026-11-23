<script lang="ts">
	import Window from './Window.svelte';

	type Project = {
		name: string;
		language: string;
		description: string;
		repo: string;
		site?: string;
		tags: string[];
	};

	const projects: Project[] = [
		{
			name: 'venv_manager',
			language: 'Go',
			description:
				'Safe, observable and reversible Python environments for developers and AI coding agents. CLI, TUI and MCP server in one Go binary.',
			repo: 'https://github.com/jacopobonomi/venv_manager',
			site: 'https://venv-manager.com/',
			tags: ['CLI', 'TUI', 'MCP server']
		},
		{
			name: 'source-sap-hana',
			language: 'Python',
			description:
				'Airbyte source connector for SAP HANA, built on the Python CDK and hdbcli: resumable full refresh, incremental sync, SSH tunnel and per-stream filters.',
			repo: 'https://github.com/jacopobonomi/source-sap-hana',
			tags: ['Airbyte', 'SAP HANA', 'Data']
		},
		{
			name: 'shorten',
			language: 'TypeScript',
			description: 'Simple self hosted link shortener written in Node, using DynamoDB.',
			repo: 'https://github.com/jacopobonomi/shorten',
			tags: ['Node', 'DynamoDB', 'Self hosted']
		}
	];
</script>

<Window id="project" title="Stage 3 · Inventory" path="~/projects">
	<h2 class="pixel text-2xl leading-snug uppercase md:text-4xl md:leading-snug">open source</h2>
	<p class="mt-6 max-w-3xl text-slate-300">
		Things I build in the open, mostly to scratch my own itch. The rest lives on
		<a href="https://github.com/jacopobonomi" class="link">Github</a>.
	</p>

	<div class="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
		{#each projects as project, i (project.name)}
			<article class="card flex flex-col">
				<div class="flex items-center justify-between gap-2">
					<span class="tag">Item {String(i + 1).padStart(2, '0')}</span>
					<span class="tag tag-side">{project.language}</span>
				</div>
				<p class="mt-4 text-xl font-bold">{project.name}</p>
				<p class="mt-2 flex-1 text-sm text-slate-200">{project.description}</p>
				<p class="mt-4 text-xs text-slate-400">
					{#each project.tags as tag (tag)}
						<span class="mr-2">#{tag}</span>
					{/each}
				</p>
				<div class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
					<a href={project.repo} class="link"><i class="fab fa-github pr-1"></i>source</a>
					{#if project.site}
						<a href={project.site} class="link">website</a>
					{/if}
				</div>
			</article>
		{/each}
	</div>
</Window>
