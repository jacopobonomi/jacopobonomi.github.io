<script lang="ts">
	import Window from './Window.svelte';

	type Job = {
		role: string;
		company: string;
		url?: string;
		period: string;
		running: boolean;
		stack: string[];
	};

	// newest first
	const jobs: Job[] = [
		{
			role: 'Tech Lead',
			company: 'Giunti Editore',
			url: 'https://www.giunti.it/',
			period: '09/01/2023 - today',
			running: true,
			stack: [
				'Infrastructure (AWS, on premise: Nutanix/Proxmox)',
				'Security and networking (Fortinet/OPNsense)',
				'R&D: replacing legacy software with in-house platforms',
				'Backend (Golang, Python)',
				'Frontend (NextJS, on a single shared UI framework)'
			]
		},
		{
			role: 'Software engineer, Team leader',
			company: 'Develon (Product, advice)',
			url: 'https://www.develondigital.com/',
			period: '10/11/2021 - 31/12/2022',
			running: false,
			stack: [
				'AWS (many services)',
				'Backend (NodeJS [NestJS, AdonisJS, Fastify])',
				'Frontend (VueJS, Nuxt [really a little bit])'
			]
		},
		{
			role: 'CTO',
			company: 'Slum (Communication)',
			url: 'https://slumdesign.com',
			period: '15/08/2019 - 31/12/2022',
			running: false,
			stack: [
				'Backend (NodeJS, Golang, PHP)',
				'Frontend (ReactJS, NextJS)',
				'App (Flutter)',
				'AWS (Lambda, ECS, EC2, S3, ElasticSearch, Amplify, RDS, Cloudfront... [Terraform])'
			]
		},
		{
			role: 'Web developer',
			company: 'Cabel (Banking)',
			url: 'https://www.cabel.it/',
			period: '10/02/2019 - 10/08/2019',
			running: false,
			stack: ['Java, Jenkins, Jackson, Spring, .NET, AngularJS']
		},
		{
			role: 'Self employed',
			company: 'self employed',
			period: '11/06/2017 - today',
			running: false,
			stack: ['really too many languages and software to write them.']
		},
		{
			role: 'System administrator',
			company: 'Hi-tech (Health)',
			url: 'https://www.hitech-sanita.it/',
			period: '10/04/2015 - 10/09/2015',
			running: false,
			stack: ['Linux, Git, Docker, MySQL, LDAP']
		}
	];
</script>

<Window id="experience" title="Stage 2 · Quest log" path="~/work">
	<h2 class="pixel text-2xl leading-snug uppercase md:text-4xl md:leading-snug">work experience</h2>
	<p class="mt-6 max-w-3xl text-slate-300">
		I know that languages and technologies don't matter much, but I think it's useful for specific
		role searches and for Google robots &#129302;.
	</p>
	<p class="mt-2 text-sm text-slate-400">
		I love AWS, Golang, NodeJS, ReactJS, Docker, Kubernetes, Terraform, Linux, Open Source, and much
		more.
	</p>

	<div class="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
		{#each jobs as job, i (job.role + job.period)}
			<article class="card" class:card-active={job.running}>
				<div class="flex items-center justify-between gap-2">
					<span class="tag">Quest {String(jobs.length - i).padStart(2, '0')}</span>
					{#if job.running}
						<span class="tag tag-active">&#9654; In progress</span>
					{:else if job.period.endsWith('today')}
						<span class="tag tag-side">Side quest</span>
					{:else}
						<span class="tag tag-done">&#10004; Complete</span>
					{/if}
				</div>
				<p class="mt-4 text-xl font-bold uppercase">{job.role}</p>
				{#if job.url}
					<a href={job.url} class="link">{job.company}</a>
				{:else}
					<p class="text-slate-300">{job.company}</p>
				{/if}
				<p class="mt-1 mb-4 text-sm text-slate-400">{job.period}</p>
				<ul class="space-y-1 text-sm text-slate-200">
					{#each job.stack as line (line)}
						<li class="flex gap-2"><span class="text-yellow-300">+</span><span>{line}</span></li>
					{/each}
				</ul>
			</article>
		{/each}
	</div>
</Window>
